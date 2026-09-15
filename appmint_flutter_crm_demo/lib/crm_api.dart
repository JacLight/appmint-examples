import 'package:appmint_flutter_client/appmint_flutter_client.dart';

/// The CRM endpoints this app uses, and the things about them that are not
/// obvious from their names.
///
/// Thin on purpose: each method is one request, the shape is a plain map, and
/// the comments are the part worth reading. Every claim below was checked by
/// calling the real server, not by reading about it.
class CrmApi {
  CrmApi(this._appmint);

  final Appmint _appmint;
  AppmintHttp get _http => _appmint.http;

  // ── leads ─────────────────────────────────────────────────────────────

  /// Leads live under `/crm/leads/detail`, not the repository — the service
  /// scores them, logs their history and fills in names. `search` matches
  /// name, email and company.
  ///
  /// No `sortField`: the route prefixes it with `data.`, so asking for
  /// `modifydate` sorts on a field no lead has and the order goes random.
  /// Left out, the list comes most-recently-modified first, which is the
  /// order you want.
  Future<List<Map<String, dynamic>>> listLeads({
    String? search,
    String? status,
    int pageSize = 50,
  }) async {
    final res = await _http.get('/crm/leads/detail', query: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
      'pageSize': '$pageSize',
    });
    return _rows(res);
  }

  Future<Map<String, dynamic>> getLead(String id) async =>
      _map(await _http.get('/crm/leads/detail/$id'));

  /// Almost nothing is required. The server fills in `name` (a LEAD… number),
  /// splits `fullName` into first and last, defaults `status` to `new` and
  /// `source` to `other`, and scores it. An email, if given, must be valid —
  /// that is the one thing it refuses.
  Future<Map<String, dynamic>> createLead({
    required String fullName,
    String? email,
    String? phone,
    String? company,
    String source = 'other',
  }) async {
    return _map(await _http.post('/crm/leads/detail', body: {
      'fullName': fullName,
      'email': ?email,
      'phone': ?phone,
      'company': ?company,
      'source': source,
      'status': 'new',
    }));
  }

  /// Each of these changes the lead AND writes a `lead_activity` record with
  /// who did it and why — which is what makes the timeline honest without
  /// anyone typing notes afterwards.
  Future<Map<String, dynamic>> qualify(String id, {String? notes}) async =>
      _map(await _http.post('/crm/leads/qualify/$id', body: {'notes': ?notes}));

  Future<Map<String, dynamic>> disqualify(String id, {String? reason}) async =>
      _map(await _http.post('/crm/leads/disqualify/$id', body: {'reason': ?reason}));

  Future<Map<String, dynamic>> assign(String id, String toEmail) async =>
      _map(await _http.post('/crm/leads/assign/$id', body: {'assignedTo': toEmail}));

  Future<Map<String, dynamic>> scheduleFollowUp(String id, DateTime when,
          {String? notes}) async =>
      _map(await _http.post('/crm/leads/follow-up/$id', body: {
        'followUpDate': when.toUtc().toIso8601String(),
        'notes': ?notes,
      }));

  Future<Map<String, dynamic>> convert(String id, {num? value}) async =>
      _map(await _http.post('/crm/leads/convert/$id',
          body: {'conversionValue': ?value}));

  /// A note. Unlike the actions above this is stored *on* the lead
  /// (`data.activities`), not as a `lead_activity` record — so the timeline
  /// below reads both.
  Future<void> addNote(String id, String text) async {
    await _http.post('/crm/leads/activities/$id',
        body: {'type': 'note', 'description': text});
  }

  /// The lead's history, oldest first: every action the server logged for it
  /// plus the notes stored on the record itself.
  ///
  /// Actions are `lead_activity` records whose `owner` is the lead, so they
  /// are found by `owner.id` — a root field, not under `data`.
  Future<List<TimelineEntry>> leadTimeline(String id, Map<String, dynamic> lead) async {
    final res = await _appmint.repository.find(
      'lead_activity',
      filter: {'owner.id': id},
      sort: {'createdate': 1},
      pageSize: 200,
    );
    final entries = <TimelineEntry>[
      for (final r in res.items)
        TimelineEntry(
          at: DateTime.tryParse('${r['createdate']}') ?? DateTime.now(),
          kind: '${r['data']?['activityType'] ?? 'activity'}',
          who: '${r['data']?['performedBy'] ?? ''}',
          text: '${r['data']?['data']?['details'] ?? r['data']?['data']?['action'] ?? ''}',
        ),
      for (final a in (lead['activities'] as List? ?? const []))
        if (a is Map)
          TimelineEntry(
            at: DateTime.tryParse('${a['createdAt']}') ?? DateTime.now(),
            kind: '${a['type'] ?? 'note'}',
            who: '${a['createdBy'] ?? ''}',
            text: '${a['description'] ?? a['notes'] ?? ''}',
          ),
    ]..sort((a, b) => a.at.compareTo(b.at));
    return entries;
  }

  // ── contacts ──────────────────────────────────────────────────────────

  /// Contacts are customer records. Text search is
  /// `POST /repository/search/customer` with **`keyword`** — `query` (the word
  /// you would guess) makes the server throw, and `search` is ignored and
  /// returns everyone.
  Future<List<Map<String, dynamic>>> searchContacts(String keyword) async {
    final res = await _http.post('/repository/search/customer',
        body: {'keyword': keyword, 'pageSize': 30});
    return _rows(res);
  }

  Future<List<Map<String, dynamic>>> recentContacts() async {
    final res = await _appmint.repository.find('customer',
        sort: {'createdate': -1}, pageSize: 30);
    return res.items.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  /// What this person has done across the platform — visits, orders,
  /// bookings, chats. Keyed by email. Empty for somebody who has only ever
  /// been a record, which is most contacts you type in by hand.
  Future<Map<String, dynamic>> contactTimeline(String email) async =>
      _map(await _http.get('/crm/customer-activity/$email/timeline',
          query: {'limit': '50'}));

  Future<Map<String, dynamic>> contactSummary(String email) async =>
      _map(await _http.get('/crm/customer-activity/$email/summary'));

  // ── the phone ─────────────────────────────────────────────────────────

  /// Numbers assigned to the signed-in person — directly, or through a group
  /// they belong to. Empty means the dial pad and Text buttons have nothing
  /// to send from, and the app should say so rather than look broken.
  Future<List<Map<String, dynamic>>> myNumbers() async =>
      _rows(await _http.get('/phone/user-phones'));

  /// Every number the organization owns.
  Future<List<Map<String, dynamic>>> orgNumbers() async =>
      _rows(await _http.get('/phone/numbers'));

  /// A text goes out as a `message` record, the same one the inbox shows,
  /// through the inbox route with `?send=true`. The record comes back
  /// `pending`; a moment later it is `sent` or `failed` with an `error`.
  ///
  /// On a server with no SMS gateway configured the record still goes to
  /// `sent` — nothing left the building, but nothing said so either. Check
  /// the organization's Twilio integration before trusting a green tick.
  Future<Map<String, dynamic>> sendText({
    required String to,
    required String from,
    required String text,
  }) async {
    return _map(await _http.post('/crm/inbox/update?send=true', body: {
      'datatype': 'message',
      'isNew': true,
      'data': {
        'to': [to],
        'from': from,
        'text': text,
        'deliveryType': 'sms',
        'type': 'message',
        'status': 'draft',
      },
    }));
  }

  Future<Map<String, dynamic>> readMessage(String id) async {
    final res = await _appmint.repository.find('message', filter: {'sk': id}, pageSize: 1);
    return res.items.isEmpty ? {} : Map<String, dynamic>.from(res.items.first);
  }

  /// A short-lived Twilio Voice token for this person. Getting it is the
  /// server's half of a call; ringing is the native SDK's half, which a
  /// browser example cannot do. See the tutorial for what comes next.
  Future<Map<String, dynamic>> voiceToken() async =>
      _map(await _http.post('/phone/token', body: {'platform': 'web'}));

  // ── helpers ───────────────────────────────────────────────────────────

  static Map<String, dynamic> _map(dynamic res) =>
      res is Map ? Map<String, dynamic>.from(res) : <String, dynamic>{};

  static List<Map<String, dynamic>> _rows(dynamic res) {
    final raw = res is Map ? (res['data'] ?? res['items'] ?? res['results']) : res;
    return raw is List
        ? raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : const [];
  }
}

class TimelineEntry {
  const TimelineEntry({
    required this.at,
    required this.kind,
    required this.who,
    required this.text,
  });
  final DateTime at;
  final String kind;
  final String who;
  final String text;
}

/// Display helpers for the two record shapes this app shows.
extension RecordView on Map<String, dynamic> {
  Map<String, dynamic> get d =>
      this['data'] is Map ? Map<String, dynamic>.from(this['data']) : this;
  String get id => (this['sk'] ?? this['id'] ?? d['id'] ?? '').toString();
  String get displayName {
    final x = d;
    final full = (x['fullName'] ?? '').toString().trim();
    if (full.isNotEmpty) return full;
    final parts = [x['firstName'], x['lastName']]
        .where((s) => s != null && '$s'.trim().isNotEmpty)
        .join(' ');
    if (parts.isNotEmpty) return parts;
    return (x['email'] ?? x['username'] ?? x['name'] ?? '—').toString();
  }
  String get email => (d['email'] ?? d['username'] ?? '').toString();
  String get phone => (d['phone'] ?? d['phoneNumber'] ?? d['mobile'] ?? '').toString();
}
