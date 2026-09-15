import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../crm_api.dart';
import '../main.dart';

/// Text or call somebody — through the organization's number, never the
/// device's own. Opened from a lead or a contact.
Future<void> showReachSheet(
  BuildContext context,
  DemoState state, {
  required String name,
  required String phone,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _ReachSheet(state: state, name: name, phone: phone),
    ),
  );
}

class _ReachSheet extends StatefulWidget {
  const _ReachSheet({required this.state, required this.name, required this.phone});

  final DemoState state;
  final String name;
  final String phone;

  @override
  State<_ReachSheet> createState() => _ReachSheetState();
}

class _ReachSheetState extends State<_ReachSheet> {
  final _text = TextEditingController();
  List<Map<String, dynamic>> _mine = const [];
  List<Map<String, dynamic>> _org = const [];
  String? _from;
  bool _loading = true;
  bool _busy = false;
  String? _error;
  String? _result;

  @override
  void initState() {
    super.initState();
    _numbers();
  }

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  /// Which number this goes out from. Yours if you have one; otherwise any
  /// number the organization owns that can text — and the sheet says which
  /// case you are in, because "the Text button does nothing" is almost
  /// always "no number is assigned to you".
  Future<void> _numbers() async {
    try {
      final mine = await widget.state.api.myNumbers();
      final org = await widget.state.api.orgNumbers();
      if (!mounted) return;
      final sms = org.where((n) => n.d['capabilities']?['sms'] == true).toList();
      setState(() {
        _mine = mine;
        _org = sms;
        _from = (mine.isNotEmpty ? mine.first : (sms.isNotEmpty ? sms.first : null))
            ?.d['phoneNumber']
            ?.toString();
      });
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final from = _from;
    if (from == null || _text.text.trim().isEmpty) return;
    setState(() {
      _busy = true;
      _error = null;
      _result = null;
    });
    try {
      final saved = await widget.state.api.sendText(
        to: widget.phone,
        from: from,
        text: _text.text.trim(),
      );
      // The record comes back `pending`. Read it again a moment later for
      // what actually happened to it.
      await Future<void>.delayed(const Duration(seconds: 2));
      final again = await widget.state.api.readMessage(saved.id);
      final status = (again.d['status'] ?? saved.d['status'] ?? '?').toString();
      final err = again.d['error'];
      if (mounted) {
        setState(() {
          _result = 'Message ${saved.id} · status: $status${err != null ? ' · $err' : ''}';
          if (status == 'sent' || status == 'delivered') _text.clear();
        });
      }
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _call() async {
    setState(() {
      _busy = true;
      _error = null;
      _result = null;
    });
    try {
      final t = await widget.state.api.voiceToken();
      final token = (t['token'] ?? '').toString();
      final identity = (t['identity'] ?? '').toString();
      if (mounted) {
        setState(() => _result = token.isEmpty
            ? 'The server returned no voice token.'
            : 'Voice token issued for $identity (${token.length} chars). '
                'This is the server\'s half of a call. Ringing ${widget.phone} '
                'needs the native Twilio Voice SDK — see the tutorial.');
      }
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Reach ${widget.name}', style: theme.textTheme.titleLarge),
            Text(widget.phone,
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline)),
            const SizedBox(height: 14),
            if (_loading)
              const LinearProgressIndicator()
            else if (_from == null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'No number to send from. None is assigned to you, and the '
                  'organization has no number that can text. Ask an admin to '
                  'assign one — until then the buttons below have nothing to use.',
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _from,
                      decoration: const InputDecoration(labelText: 'From'),
                      items: [
                        for (final n in [..._mine, ..._org.where((o) => !_mine.any((m) => m.id == o.id))])
                          DropdownMenuItem(
                            value: n.d['phoneNumber'].toString(),
                            child: Text('${n.d['phoneNumber']} · ${n.d['friendlyName'] ?? ''}'
                                '${_mine.any((m) => m.id == n.id) ? ' (yours)' : ' (organization)'}'),
                          ),
                      ],
                      onChanged: (v) => setState(() => _from = v),
                    ),
                  ),
                ],
              ),
            if (!_loading && _from != null && _mine.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  'No number is assigned to you; this uses one of the organization\'s. '
                  'Replies will land in the shared inbox, not with you.',
                  style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFFD98C1E)),
                ),
              ),
            const SizedBox(height: 12),
            TextField(
              controller: _text,
              maxLines: 3,
              minLines: 2,
              enabled: _from != null && !_busy,
              decoration: const InputDecoration(labelText: 'Text message'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                FilledButton.icon(
                  onPressed: _from == null || _busy ? null : _send,
                  icon: const Icon(Icons.send, size: 18),
                  label: const Text('Send text'),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: _busy ? null : _call,
                  icon: const Icon(Icons.call, size: 18),
                  label: const Text('Call'),
                ),
              ],
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
            ],
            if (_result != null) ...[
              const SizedBox(height: 10),
              SelectableText(_result!,
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary)),
            ],
          ],
        ),
      ),
    );
  }
}
