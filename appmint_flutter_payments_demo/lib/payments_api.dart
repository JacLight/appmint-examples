import 'package:appmint_flutter_client/appmint_flutter_client.dart';

/// The POS endpoints this app uses, and the things about them that are not
/// obvious from their names.
///
/// A sale is an `sf_order` — the same record a web checkout makes — opened
/// as a "tab", filled with items, and settled one tender at a time. Thin on
/// purpose: one request per method, plain maps, and the comments are the
/// part worth reading. Every rule below was checked against the real server.
class PaymentsApi {
  PaymentsApi(this._appmint);

  final Appmint _appmint;
  AppmintHttp get _http => _appmint.http;

  // ── the catalogue ─────────────────────────────────────────────────────

  /// Products with a SKU. Items are added to a tab *by SKU*; a product
  /// without one cannot be sold here.
  Future<List<Map<String, dynamic>>> products() async {
    final page = await _appmint.repository.find(
      'sf_product',
      filter: {
        'data.sku': {r'$exists': true, r'$ne': ''}
      },
      sort: {'data.title': 1},
      pageSize: 100,
    );
    return page.items.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  // ── tabs ──────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> openTabs() async =>
      _rows(await _http.get('/storefront/pos/tabs'));

  Future<List<Map<String, dynamic>>> closedTabs() async =>
      _rows(await _http.get('/storefront/pos/tabs/closed'));

  /// Open a tab. Everything is optional; with no `alias` the server names it
  /// "Walk-up #n". It comes back as an `sf_order` with `status: new` and
  /// `amount: 0`.
  Future<Map<String, dynamic>> openTab({String? alias}) async =>
      _map(await _http.post('/storefront/pos/tab', body: {'alias': ?alias}));

  Future<Map<String, dynamic>> tab(String id) async =>
      _map(await _http.get('/repository/get/sf_order/$id'));

  /// Add lines. Items are identified by `sku` (case-insensitive); the server
  /// looks the product up, prices it, and recomputes the order's totals. An
  /// unknown SKU is *"Product not found: …"*, and a tab that is already paid
  /// refuses new items.
  Future<Map<String, dynamic>> addItems(
    String tabId,
    List<({String sku, int quantity})> items,
  ) async =>
      _map(await _http.post('/storefront/order/$tabId/items', body: {
        'items': [
          for (final i in items) {'sku': i.sku, 'quantity': i.quantity},
        ],
      }));

  // ── money ─────────────────────────────────────────────────────────────

  /// Record one tender against the tab. The server holds the rules:
  ///
  ///  * `amount` is what was tendered. **Cash may exceed the balance** — the
  ///    payment is booked as the amount due and the rest comes back as
  ///    change, in the transaction's `remarks` ("tendered: 50, change: 30").
  ///  * Any other tender for more than is due is refused: *"Payment of
  ///    100.00 exceeds the 60.00 due … overpayment is only accepted on cash
  ///    tenders"*. Charge the balance, not the total.
  ///  * A tab that is paid refuses another tender: *"Order is already paid
  ///    in full"*.
  ///  * Each tender stands on its own. Two cash payments of 40 and 20 are
  ///    two lines; the tab goes `paid-partial` after the first and `paid`
  ///    after the second. A card that declines does not undo cash already
  ///    taken.
  ///
  /// `method` is free text the receipt shows (`cash`, `card`, `bank`…);
  /// `gateway` is where the money actually moved (`manual` when it did not
  /// move through this server); `ref` is the approval code, payment intent
  /// id, or note that lets a refund find the line later.
  Future<SettleResult> settle(
    String tabId, {
    required num amount,
    required String method,
    String gateway = 'manual',
    String? ref,
    num? tip,
  }) async {
    final res = _map(await _http.post('/storefront/pos/tab/$tabId/settle', body: {
      'amount': amount,
      'method': method,
      'gateway': gateway,
      'ref': ?ref,
      'tip': ?tip,
    }));
    return SettleResult(
      order: _map(res['order']),
      transaction: _map(res['transaction']),
    );
  }

  /// Refund one payment line, in full or in part. Identified by the
  /// transaction id the settle handed back (or by `ref`). Writes a negative
  /// transaction, marks the line refunded, and recomputes the order's
  /// status. A line can be refunded once.
  Future<Map<String, dynamic>> refund(
    String tabId, {
    required String transactionId,
    num? amount,
    String? reason,
  }) async =>
      _map(await _http.post('/storefront/pos/tab/$tabId/refund', body: {
        'transactionId': transactionId,
        'amount': ?amount,
        'reason': ?reason,
      }));

  // ── receipts ──────────────────────────────────────────────────────────

  /// The receipt as the server would print it: a list of ESC/POS-ish lines
  /// (`{kind: text|image, text, bold, size}`) at a given paper width. The
  /// app draws them; a printer would just be handed them.
  Future<Map<String, dynamic>> receiptPayload(String tabId) async =>
      _map(await _http.get('/storefront/pos/tab/$tabId/receipt-payload'));

  /// Email or text the receipt. Answers `{sent, channel, recipients}`.
  Future<Map<String, dynamic>> sendReceipt(
    String tabId, {
    String? email,
    String? phone,
  }) async =>
      _map(await _http.post('/storefront/pos/tab/$tabId/send-receipt', body: {
        'email': ?email,
        'phone': ?phone,
        'mode': email != null ? 'email' : 'sms',
      }));

  // ── card present ──────────────────────────────────────────────────────

  /// The server's half of a card-present payment: a single-use Stripe
  /// Terminal connection token. The Terminal SDK on a device takes it,
  /// discovers a reader over Bluetooth, and collects the card. A browser
  /// example can get the token; it cannot ring a reader.
  Future<String> terminalConnectionToken() async {
    final res = _map(await _http.post('/storefront/stripe/terminal/connection-token', body: {}));
    return (res['secret'] ?? '').toString();
  }

  // ── helpers ───────────────────────────────────────────────────────────

  static Map<String, dynamic> _map(dynamic res) =>
      res is Map ? Map<String, dynamic>.from(res) : <String, dynamic>{};

  static List<Map<String, dynamic>> _rows(dynamic res) {
    final raw = res is Map ? (res['data'] ?? res['items']) : res;
    return raw is List
        ? raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : const [];
  }
}

class SettleResult {
  const SettleResult({required this.order, required this.transaction});
  final Map<String, dynamic> order;
  final Map<String, dynamic> transaction;
}

/// Display helpers for order records.
extension OrderView on Map<String, dynamic> {
  Map<String, dynamic> get d =>
      this['data'] is Map ? Map<String, dynamic>.from(this['data']) : this;
  String get id => (this['sk'] ?? '').toString();
  String get alias => (d['alias'] ?? d['number'] ?? id).toString();
  String get status => (d['status'] ?? 'new').toString();
  num get amount => (d['amount'] as num?) ?? 0;
  num get paid => (d['amountPaid'] as num?) ?? 0;
  num get due => (amount - paid).clamp(0, double.infinity);
  List<Map<String, dynamic>> get items => [
        for (final i in (d['productItems'] as List? ?? const []))
          if (i is Map) Map<String, dynamic>.from(i),
      ];
  List<Map<String, dynamic>> get payments => [
        for (final p in (d['payments'] as List? ?? const []))
          if (p is Map) Map<String, dynamic>.from(p),
      ];
}

String money(num v) => '\$${v.toStringAsFixed(2)}';
