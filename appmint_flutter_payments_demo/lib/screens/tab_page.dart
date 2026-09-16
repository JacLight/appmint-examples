import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';
import '../payments_api.dart';
import 'take_payment_sheet.dart';

/// One tab: what is on it, what has been paid, and the ways to take the rest.
class TabPage extends StatefulWidget {
  const TabPage({super.key, required this.state, required this.tabId});

  final DemoState state;
  final String tabId;

  @override
  State<TabPage> createState() => _TabPageState();
}

class _TabPageState extends State<TabPage> {
  Map<String, dynamic>? _tab;
  String? _error;
  String? _notice;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final t = await widget.state.api.tab(widget.tabId);
      if (mounted) {
        setState(() {
          _tab = t;
          _error = null;
        });
      }
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  Future<void> _addItems() async {
    final picked = await showDialog<List<({String sku, int quantity})>>(
      context: context,
      builder: (_) => _PickItemsDialog(state: widget.state),
    );
    if (picked == null || picked.isEmpty) return;
    try {
      await widget.state.api.addItems(widget.tabId, picked);
      await _load();
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  Future<void> _takePayment() async {
    final tab = _tab;
    if (tab == null) return;
    final result = await showTakePaymentSheet(context, widget.state, tab: tab);
    if (result != null && mounted) setState(() => _notice = result);
    await _load();
  }

  Future<void> _refund(Map<String, dynamic> payment) async {
    final txn = (payment['transactionId'] ?? '').toString();
    final amount = (payment['amount'] as num?) ?? 0;
    final result = await showDialog<String>(
      context: context,
      builder: (_) => _RefundDialog(
        state: widget.state,
        tabId: widget.tabId,
        transactionId: txn,
        max: amount,
      ),
    );
    if (result != null && mounted) setState(() => _notice = result);
    await _load();
  }

  Future<void> _receipt() async {
    try {
      final payload = await widget.state.api.receiptPayload(widget.tabId);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (_) => _ReceiptDialog(state: widget.state, tabId: widget.tabId, payload: payload),
      );
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tab = _tab;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 16, 20, 4),
          child: Row(
            children: [
              IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
              Expanded(child: Text(tab?.alias ?? '…', style: theme.textTheme.headlineSmall)),
              if (tab != null) _StatusChip(status: tab.status),
            ],
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 4, 28, 0),
            child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
          ),
        if (_notice != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 4, 28, 0),
            child: SelectableText(_notice!, style: TextStyle(color: theme.colorScheme.primary)),
          ),
        if (tab == null)
          const Expanded(child: Center(child: CircularProgressIndicator()))
        else
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(28, 8, 28, 120),
              children: [
                _Header(
                  title: 'Items',
                  action: TextButton.icon(
                    onPressed: tab.status == 'paid' ? null : _addItems,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add'),
                  ),
                ),
                if (tab.items.isEmpty)
                  _muted(context, 'Nothing on this tab yet. Add something before taking money — '
                      'the server refuses a payment on a zero tab.')
                else
                  for (final i in tab.items)
                    ListTile(
                      dense: true,
                      title: Text('${i['name'] ?? i['sku']}'),
                      subtitle: Text('${i['sku']} · ${i['quantity']} × ${money((i['unitPrice'] as num?) ?? 0)}'),
                      trailing: Text(money((i['amount'] as num?) ?? 0)),
                    ),
                const SizedBox(height: 8),
                _Totals(tab: tab),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.icon(
                      onPressed: tab.due > 0 && tab.items.isNotEmpty ? _takePayment : null,
                      icon: const Icon(Icons.payments_outlined, size: 18),
                      label: Text(tab.due > 0 ? 'Take ${money(tab.due)}' : 'Paid in full'),
                    ),
                    OutlinedButton.icon(
                      onPressed: tab.payments.isEmpty ? null : _receipt,
                      icon: const Icon(Icons.receipt_outlined, size: 18),
                      label: const Text('Receipt'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text('Payments', style: theme.textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'Each tender is its own line and its own transaction. Refunds are negative lines '
                  'that point at the payment they undo.',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
                ),
                const SizedBox(height: 6),
                if (tab.payments.isEmpty)
                  _muted(context, 'None yet.')
                else
                  for (final p in tab.payments) _PaymentRow(payment: p, onRefund: () => _refund(p)),
              ],
            ),
          ),
      ],
    );
  }

  Widget _muted(BuildContext context, String s) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text(s,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.outline)),
      );
}

class _Totals extends StatelessWidget {
  const _Totals({required this.tab});
  final Map<String, dynamic> tab;
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final d = tab.d;
    Widget row(String k, num v, {bool strong = false}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(children: [
            Expanded(child: Text(k, style: strong ? theme.textTheme.titleMedium : theme.textTheme.bodyMedium)),
            Text(money(v), style: strong ? theme.textTheme.titleMedium : theme.textTheme.bodyMedium),
          ]),
        );
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(children: [
        row('Subtotal', (d['subtotal'] as num?) ?? 0),
        row('Tax', (d['tax'] as num?) ?? 0),
        if (((d['discount'] as num?) ?? 0) != 0) row('Discount', -((d['discount'] as num?) ?? 0)),
        row('Total', tab.amount, strong: true),
        row('Paid', tab.paid),
        row('Due', tab.due, strong: true),
      ]),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow({required this.payment, required this.onRefund});
  final Map<String, dynamic> payment;
  final VoidCallback onRefund;
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final p = payment;
    final amount = (p['amount'] as num?) ?? 0;
    final isRefund = amount < 0;
    final refunded = p['refunded'] == true;
    final refundedAmount = (p['refundedAmount'] as num?) ?? 0;
    final tendered = p['tendered'];
    final change = p['change'];
    final details = [
      if (p['ref'] != null) 'ref ${p['ref']}',
      if (tendered != null) 'tendered ${money(tendered as num)}',
      if (change != null && (change as num) > 0) 'change ${money(change)}',
      if (refundedAmount > 0) 'refunded ${money(refundedAmount)}',
      if (refunded) 'fully refunded',
    ].join(' · ');
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        isRefund ? Icons.undo : Icons.attach_money,
        color: isRefund ? theme.colorScheme.error : theme.colorScheme.primary,
      ),
      title: Text('${p['method'] ?? p['paymentMethod'] ?? 'payment'} ${money(amount)}'),
      subtitle: Text(details.isEmpty ? '${p['transactionId'] ?? ''}' : details),
      trailing: isRefund || refunded || amount <= 0
          ? null
          : TextButton(onPressed: onRefund, child: const Text('Refund')),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.title, required this.action});
  final String title;
  final Widget action;
  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(child: Text(title, style: Theme.of(context).textTheme.titleMedium)),
        action,
      ]);
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;
  @override
  Widget build(BuildContext context) {
    final colour = switch (status) {
      'paid' => const Color(0xFF0B7A75),
      'paid-partial' => const Color(0xFFD98C1E),
      'refunded' => Theme.of(context).colorScheme.error,
      _ => Theme.of(context).colorScheme.outline,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colour.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(status, style: TextStyle(color: colour, fontWeight: FontWeight.w600)),
    );
  }
}

/// Pick products by SKU. The catalogue is whatever the organization sells;
/// only products with a SKU can go on a tab.
class _PickItemsDialog extends StatefulWidget {
  const _PickItemsDialog({required this.state});
  final DemoState state;
  @override
  State<_PickItemsDialog> createState() => _PickItemsDialogState();
}

class _PickItemsDialogState extends State<_PickItemsDialog> {
  List<Map<String, dynamic>> _products = const [];
  final Map<String, int> _qty = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    widget.state.api.products().then((p) {
      if (mounted) setState(() => _products = p);
    }).catchError((Object e) {
      if (mounted) setState(() => _error = e is AppmintException ? e.message : '$e');
    }).whenComplete(() {
      if (mounted) setState(() => _loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AlertDialog(
      title: const Text('Add items'),
      content: SizedBox(
        width: 460,
        height: 420,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Text(_error!, style: TextStyle(color: theme.colorScheme.error))
                : ListView.builder(
                    itemCount: _products.length,
                    itemBuilder: (context, i) {
                      final p = _products[i];
                      final d = p['data'] as Map;
                      final sku = '${d['sku']}';
                      final q = _qty[sku] ?? 0;
                      return ListTile(
                        dense: true,
                        title: Text('${d['title'] ?? d['name']}'),
                        subtitle: Text('$sku · ${money((d['price'] as num?) ?? 0)}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, size: 18),
                              onPressed: q == 0 ? null : () => setState(() => _qty[sku] = q - 1),
                            ),
                            Text('$q', style: theme.textTheme.titleMedium),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline, size: 18),
                              onPressed: () => setState(() => _qty[sku] = q + 1),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        FilledButton(
          onPressed: _qty.values.any((q) => q > 0)
              ? () => Navigator.pop(context, [
                    for (final e in _qty.entries)
                      if (e.value > 0) (sku: e.key, quantity: e.value),
                  ])
              : null,
          child: const Text('Add to tab'),
        ),
      ],
    );
  }
}

class _RefundDialog extends StatefulWidget {
  const _RefundDialog({
    required this.state,
    required this.tabId,
    required this.transactionId,
    required this.max,
  });
  final DemoState state;
  final String tabId;
  final String transactionId;
  final num max;
  @override
  State<_RefundDialog> createState() => _RefundDialogState();
}

class _RefundDialogState extends State<_RefundDialog> {
  late final _amount = TextEditingController(text: widget.max.toStringAsFixed(2));
  final _reason = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _amount.dispose();
    _reason.dispose();
    super.dispose();
  }

  Future<void> _go() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final amount = num.tryParse(_amount.text);
      await widget.state.api.refund(
        widget.tabId,
        transactionId: widget.transactionId,
        amount: amount,
        reason: _reason.text.trim().isEmpty ? null : _reason.text.trim(),
      );
      if (mounted) Navigator.pop(context, 'Refunded ${money(amount ?? widget.max)}.');
    } on AppmintException catch (e) {
      // "Payment is already refunded", "Refund amount must be > 0", or a
      // partial that exceeds what is left — all the server's own words.
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Refund'),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _amount,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Amount',
                helperText: 'Up to ${money(widget.max)}. Less is a partial refund.',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _reason,
              decoration: const InputDecoration(labelText: 'Reason (optional)'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: _busy ? null : () => Navigator.pop(context), child: const Text('Cancel')),
        FilledButton(onPressed: _busy ? null : _go, child: Text(_busy ? 'Refunding…' : 'Refund')),
      ],
    );
  }
}

/// The receipt as the server would print it, and the two ways to send it.
class _ReceiptDialog extends StatefulWidget {
  const _ReceiptDialog({required this.state, required this.tabId, required this.payload});
  final DemoState state;
  final String tabId;
  final Map<String, dynamic> payload;
  @override
  State<_ReceiptDialog> createState() => _ReceiptDialogState();
}

class _ReceiptDialogState extends State<_ReceiptDialog> {
  final _to = TextEditingController();
  String? _result;
  bool _busy = false;

  @override
  void dispose() {
    _to.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final to = _to.text.trim();
    if (to.isEmpty) return;
    setState(() {
      _busy = true;
      _result = null;
    });
    try {
      final r = to.contains('@')
          ? await widget.state.api.sendReceipt(widget.tabId, email: to)
          : await widget.state.api.sendReceipt(widget.tabId, phone: to);
      setState(() => _result = 'Sent ${r['sent']} by ${r['channel']} to ${(r['recipients'] as List?)?.join(', ')}');
    } on AppmintException catch (e) {
      setState(() => _result = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lines = (widget.payload['lines'] as List? ?? const []).whereType<Map>().toList();
    return AlertDialog(
      title: const Text('Receipt'),
      content: SizedBox(
        width: 420,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                border: Border.all(color: theme.colorScheme.outlineVariant),
                borderRadius: BorderRadius.circular(6),
              ),
              constraints: const BoxConstraints(maxHeight: 300),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final l in lines)
                      if (l['kind'] == 'image')
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Image.network('${l['url']}', height: 40, errorBuilder: (_, _, _) => const SizedBox()),
                        )
                      else
                        Text(
                          '${l['text'] ?? ''}',
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: l['size'] == 'large' ? 15 : 12,
                            fontWeight: l['bold'] == true ? FontWeight.w700 : FontWeight.w400,
                          ),
                        ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${lines.length} lines at ${widget.payload['width']} columns — what an ESC/POS printer would be handed.',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _to,
              decoration: const InputDecoration(
                labelText: 'Email or phone',
                helperText: 'An address sends by email; a number sends by SMS.',
              ),
            ),
            if (_result != null) ...[
              const SizedBox(height: 8),
              Text(_result!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        FilledButton(onPressed: _busy ? null : _send, child: Text(_busy ? 'Sending…' : 'Send')),
      ],
    );
  }
}
