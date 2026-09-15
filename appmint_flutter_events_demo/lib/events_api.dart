import 'package:appmint_flutter_client/appmint_flutter_client.dart';

/// The events endpoints this app uses, and the things about them that are
/// not obvious from their names.
///
/// Thin on purpose: each method is one request, the shape is a plain map, and
/// the comments are the part worth reading. Every quirk below was found by
/// calling the real server, not by reading about it.
class EventsApi {
  EventsApi(this._appmint);

  final Appmint _appmint;
  AppmintHttp get _http => _appmint.http;

  // ── events ────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> listEvents() async {
    final res = await _http.get('/crm/events/get');
    return _rows(res);
  }

  /// Create an event.
  ///
  /// Not through the repository — `PUT /repository/create` with datatype
  /// `event` is refused. Events go through the CRM service, and it wants three
  /// things the error messages do not tell you about:
  ///
  ///  * `isNew: true` at the root, or you get "Not a new metrics, please use
  ///    update or set the new property"
  ///  * a `slug`, because there is a unique index on it and the second event
  ///    without one collides with the first
  ///  * both `startTime` (what the service validates, must be in the future)
  ///    and `startDate` (what the SDK model requires)
  ///
  /// It comes back as `draft` whatever status you pass. Publishing is separate.
  Future<Map<String, dynamic>> createEvent({
    required String title,
    required DateTime start,
    required DateTime end,
    String? description,
    int? capacity,
  }) async {
    final slug = _slugify(title, start);
    final res = await _http.post('/crm/events/create', body: {
      'datatype': 'event',
      'isNew': true,
      'data': {
        'name': slug,
        'title': title,
        'slug': slug,
        'startTime': start.toUtc().toIso8601String(),
        'startDate': start.toUtc().toIso8601String(),
        'endTime': end.toUtc().toIso8601String(),
        'endDate': end.toUtc().toIso8601String(),
        'description': ?description,
        'capacity': ?capacity,
      },
    });
    return Map<String, dynamic>.from(res as Map);
  }

  // ── ticket types ──────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> listTicketTypes(String eventId) async {
    final res = await _http.get('/events/$eventId/ticket-types');
    return _rows(res);
  }

  /// Ticket types are ordinary records, so these do go through the repository.
  /// An event with no active ticket type cannot issue anything — the failure
  /// is "Pick a ticket type first" on the phone and a 400 here.
  ///
  /// The field names are the model's, not the obvious ones, and the list
  /// endpoint filters on exactly these: the link to the event is `event` (not
  /// `eventId`), the limit is `capacity` (not `quantity`), and the switch is
  /// `isActive` (not `status`). A record written with the obvious names saves
  /// fine and is then invisible to `GET /events/:id/ticket-types` — that cost
  /// an hour, so it is written down here.
  ///
  /// `name` is the record's ID: unique, URL-safe, and what the server uses to
  /// spot duplicates. `title` is what people see.
  Future<Map<String, dynamic>> createTicketType({
    required String eventId,
    required String name,
    required num price,
    required int capacity,
  }) async {
    return _appmint.repository.create('event_ticket_type', {
      'event': eventId,
      'name': '${_slugify(name, DateTime.now())}-${eventId.substring(eventId.length - 6)}',
      'title': name,
      'price': price,
      'currency': 'USD',
      'capacity': capacity,
      'soldCount': 0,
      'isActive': true,
    });
  }

  // ── tickets ───────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> listTickets(String eventId) async {
    final res = await _http.get('/events/$eventId/tickets');
    return _rows(res);
  }

  /// Issue a ticket. The response carries `data.code` — that is what gets
  /// scanned, and what Manual Lookup takes when a phone will not display it.
  Future<Map<String, dynamic>> issueTicket({
    required String eventId,
    required String ticketTypeId,
    required String holderName,
    required String holderEmail,
  }) async {
    final res = await _http.post('/events/$eventId/tickets', body: {
      'ticketTypeId': ticketTypeId,
      'holderName': holderName,
      'holderEmail': holderEmail,
      'quantity': 1,
    });
    return Map<String, dynamic>.from(res as Map);
  }

  // ── the door ──────────────────────────────────────────────────────────

  /// Check somebody in. The server decides; this only reports.
  ///
  /// `success: true` with the check-in record, or `success: false` with a
  /// `reason` — "Ticket already used. Re-entry not allowed." is the one you
  /// will see most, and it is not a fake ticket, it is a re-scan.
  Future<ScanResult> checkIn(String code, {String? zone}) async {
    final res = await _http.post('/events/checkin', body: {
      'code': code,
      if (zone != null && zone.isNotEmpty) 'zone': zone,
    });
    return ScanResult.from(res, checkedIn: true);
  }

  /// Check somebody out, so occupancy is a live count rather than a running
  /// total of everyone who ever walked in.
  Future<ScanResult> checkOut(String code, {String? zone}) async {
    final res = await _http.post('/events/checkout', body: {
      'code': code,
      if (zone != null && zone.isNotEmpty) 'zone': zone,
    });
    return ScanResult.from(res, checkedIn: false);
  }

  Future<Map<String, dynamic>> stats(String eventId) async {
    final res = await _http.get('/events/$eventId/checkin-stats');
    return Map<String, dynamic>.from(res as Map);
  }

  // ── helpers ───────────────────────────────────────────────────────────

  static List<Map<String, dynamic>> _rows(dynamic res) {
    final raw = res is Map ? (res['data'] ?? res['items']) : res;
    return raw is List
        ? raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : const [];
  }

  static String _slugify(String title, DateTime start) {
    final base = title
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');
    return '$base-${start.millisecondsSinceEpoch ~/ 1000}';
  }
}

/// What the door decided.
enum ScanOutcome { admitted, alreadyUsed, denied }

class ScanResult {
  final ScanOutcome outcome;
  final String message;
  final String? holder;
  final String? ticketType;

  const ScanResult({
    required this.outcome,
    required this.message,
    this.holder,
    this.ticketType,
  });

  ScanResult withTicketType(String? label) => ScanResult(
        outcome: outcome,
        message: message,
        holder: holder,
        ticketType: label,
      );

  factory ScanResult.from(dynamic res, {required bool checkedIn}) {
    final map = res is Map ? Map<String, dynamic>.from(res) : <String, dynamic>{};
    final ticket = map['ticket'] is Map
        ? Map<String, dynamic>.from((map['ticket'] as Map)['data'] ?? map['ticket'])
        : <String, dynamic>{};
    final holder = (ticket['holderName'] ?? ticket['holder']?['name'])?.toString();
    final type = (ticket['ticketTypeName'] ?? ticket['ticketType'])?.toString();

    if (map['success'] == true) {
      return ScanResult(
        outcome: ScanOutcome.admitted,
        message: checkedIn ? 'Checked in' : 'Checked out',
        holder: holder,
        ticketType: type,
      );
    }

    final reason = (map['reason'] ?? map['message'] ?? 'Denied').toString();
    return ScanResult(
      outcome: reason.toLowerCase().contains('already')
          ? ScanOutcome.alreadyUsed
          : ScanOutcome.denied,
      message: reason,
      holder: holder,
      ticketType: type,
    );
  }
}
