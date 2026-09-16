import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';
import '../payments_api.dart';

/// Take money against a tab. Returns a sentence for the tab page, or null.
Future<String?> showTakePaymentSheet(
  BuildContext context,
  DemoState state, {
  required Map<String, dynamic> tab,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _TakePaymentSheet(state: state, tab: tab),
    ),
  );
}

enum _Tender { cash, card, reader, other }

class _TakePaymentSheet extends StatefulWidget {
  const _TakePaymentSheet({required this.state, required this.tab});
  final DemoState state;
  final Map<String, dynamic> tab;
  @override
  State<_TakePaymentSheet> createState() => _TakePaymentSheetState();
}

class _TakePaymentSheetState extends State<_TakePaymentSheet> {
  _Tender _tender = _Tender.cash;
  late final _amount = TextEditingController(text: widget.tab.due.toStringAsFixed(2));
  final _tip = TextEditingController();
  final _ref = TextEditingController();
  bool _busy = false;
  String? _error;
  String? _readerNote;

  @override
  void dispose() {
    _amount.dispose();
    _tip.dispose();
    _ref.dispose();
    super.dispose();
  }

  /// One request; the server decides whether the tender is acceptable and
  /// what it means. Its refusals are shown word for word — the overpayment
  /// one in particular says exactly what to do instead.
  Future<void> _charge() async {
    final amount = num.tryParse(_amount.text.trim());
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Enter an amount.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final r = await widget.state.api.settle(
        widget.tab.id,
        amount: amount,
        method: switch (_tender) {
          _Tender.cash => 'cash',
          _Tender.card => 'card',
          _Tender.reader => 'card',
          _Tender.other => 'other',
        },
        gateway: 'manual',
        ref: _ref.text.trim().isEmpty ? null : _ref.text.trim(),
        tip: num.tryParse(_tip.text.trim()),
      );
      final remarks = '${r.transaction['data']?['remarks'] ?? ''}';
      final change = RegExp(r'change: ([\d.]+)').firstMatch(remarks)?.group(1);
      final status = r.order.status;
      if (mounted) {
        Navigator.pop(
          context,
          '${money(r.transaction['data']?['amount'] as num? ?? amount)} taken by $_tenderName'
          '${change != null && num.parse(change) > 0 ? ' · change due ${money(num.parse(change))}' : ''}'
          ' · tab is now $status.',
        );
      }
    } on AppmintException catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.message;
        });
      }
    }
  }

  String get _tenderName => switch (_tender) {
        _Tender.cash => 'cash',
        _Tender.card => 'card',
        _Tender.reader => 'card reader',
        _Tender.other => 'other',
      };

  /// The server's half of a card-present payment. The other half — a
  /// Bluetooth reader and the Terminal SDK — needs a device build, so this
  /// example stops here, honestly, with the token in hand.
  Future<void> _probeReader() async {
    setState(() {
      _busy = true;
      _readerNote = null;
      _error = null;
    });
    try {
      final secret = await widget.state.api.terminalConnectionToken();
      setState(() => _readerNote = secret.isEmpty
          ? 'The server returned no connection token — Stripe Terminal is not configured for this organization.'
          : 'Connection token issued (${secret.substring(0, 8)}…, ${secret.length} chars). '
              'On a device, the Terminal SDK takes this, finds the reader over Bluetooth and '
              'collects the card; the payment intent id then goes in "Reference" below and the '
              'tender is recorded like any other. A browser cannot do the reader half.');
    } on AppmintException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final due = widget.tab.due;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Take payment', style: theme.textTheme.titleLarge),
            Text('${money(due)} due on ${widget.tab.alias}',
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline)),
            const SizedBox(height: 14),
            SegmentedButton<_Tender>(
              segments: const [
                ButtonSegment(value: _Tender.cash, label: Text('Cash'), icon: Icon(Icons.money, size: 16)),
                ButtonSegment(value: _Tender.card, label: Text('Card'), icon: Icon(Icons.credit_card, size: 16)),
                ButtonSegment(value: _Tender.reader, label: Text('Reader'), icon: Icon(Icons.contactless, size: 16)),
                ButtonSegment(value: _Tender.other, label: Text('Other'), icon: Icon(Icons.account_balance, size: 16)),
              ],
              selected: {_tender},
              onSelectionChanged: (s) => setState(() {
                _tender = s.first;
                _error = null;
                _readerNote = null;
              }),
            ),
            const SizedBox(height: 12),
            Text(
              switch (_tender) {
                _Tender.cash =>
                  'Enter what was handed over. Cash is the one tender allowed to exceed the amount due — the server books the balance and tells you the change.',
                _Tender.card =>
                  'A card taken elsewhere — a terminal not wired to this server, or over the phone. Record the approval code so a refund can find it. More than the balance is refused.',
                _Tender.reader =>
                  'Stripe Terminal (M2, WisePOS). This example gets the server\'s half; the reader needs a device build.',
                _Tender.other =>
                  'Bank transfer, voucher, account — recorded against the tab with a reference. More than the balance is refused.',
              },
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
            ),
            const SizedBox(height: 12),
            if (_tender == _Tender.reader) ...[
              OutlinedButton.icon(
                onPressed: _busy ? null : _probeReader,
                icon: const Icon(Icons.vpn_key_outlined, size: 18),
                label: const Text('Ask the server for a Terminal connection token'),
              ),
              if (_readerNote != null) ...[
                const SizedBox(height: 8),
                Text(_readerNote!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary)),
              ],
              const SizedBox(height: 12),
            ],
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _amount,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: _tender == _Tender.cash ? 'Tendered' : 'Amount',
                      prefixText: '\$ ',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 120,
                  child: TextField(
                    controller: _tip,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Tip', prefixText: '\$ '),
                  ),
                ),
              ],
            ),
            if (_tender != _Tender.cash) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _ref,
                decoration: const InputDecoration(
                  labelText: 'Reference',
                  helperText: 'Approval code, payment intent id, or a note — what a refund looks for.',
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
            ],
            const SizedBox(height: 14),
            Row(
              children: [
                FilledButton.icon(
                  onPressed: _busy ? null : _charge,
                  icon: const Icon(Icons.check, size: 18),
                  label: Text(_busy ? 'Recording…' : 'Record $_tenderName payment'),
                ),
                const SizedBox(width: 8),
                TextButton(onPressed: _busy ? null : () => Navigator.pop(context), child: const Text('Cancel')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
