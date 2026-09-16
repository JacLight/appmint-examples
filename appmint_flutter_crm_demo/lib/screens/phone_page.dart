import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../crm_api.dart';
import '../main.dart';

/// The phone, as the server sees it: which numbers are yours, which the
/// organization owns, and whether it will issue you a voice token.
///
/// This is the half of a softphone a browser can show. The other half —
/// audio, ringing, answering — is the native Twilio Voice SDK, and belongs in
/// a device build. The tutorial says where that code lives.
class PhonePage extends StatefulWidget {
  const PhonePage({super.key, required this.state});

  final DemoState state;

  @override
  State<PhonePage> createState() => _PhonePageState();
}

class _PhonePageState extends State<PhonePage> {
  List<Map<String, dynamic>> _mine = const [];
  List<Map<String, dynamic>> _org = const [];
  Map<String, dynamic>? _token;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final mine = await widget.state.api.myNumbers();
      final org = await widget.state.api.orgNumbers();
      if (mounted) {
        setState(() {
          _mine = mine;
          _org = org;
        });
      }
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _probeToken() async {
    setState(() => _token = null);
    try {
      final t = await widget.state.api.voiceToken();
      if (mounted) setState(() => _token = t);
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final me = widget.state.user!.email;
    final tok = _token;
    return ListView(
      padding: const EdgeInsets.fromLTRB(28, 8, 28, 120),
      children: [
        if (_error != null)
          Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
        Row(
          children: [
            Expanded(child: Text('Your numbers', style: theme.textTheme.titleMedium)),
            IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
          ],
        ),
        Text(
          'Assigned to $me directly, or through a group. Calls to these ring '
          'on your devices; texts from them are yours.',
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
        ),
        const SizedBox(height: 8),
        if (_loading)
          const LinearProgressIndicator()
        else if (_mine.isEmpty)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFD98C1E).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text(
              'None. This is the single most common reason a phone "does not '
              'work": nothing rings because nothing is assigned. An admin '
              'assigns numbers to people or groups in the organization\'s '
              'phone settings.',
            ),
          )
        else
          for (final n in _mine) _NumberTile(n: n, mine: true),
        const SizedBox(height: 24),
        Text('Organization numbers', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        if (!_loading)
          for (final n in _org) _NumberTile(n: n, mine: _mine.any((m) => m.id == n.id)),
        const SizedBox(height: 24),
        Text('Voice token', style: theme.textTheme.titleMedium),
        Text(
          'POST /phone/token — a short-lived Twilio Voice token for you. This '
          'is the server\'s half of a call; the native SDK on a device does '
          'the rest.',
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            FilledButton.tonal(onPressed: _probeToken, child: const Text('Ask for a token')),
          ],
        ),
        if (tok != null) ...[
          const SizedBox(height: 8),
          SelectableText(
            'identity: ${tok['identity'] ?? '—'}\n'
            'token: ${(tok['token'] ?? '').toString().length} characters\n'
            'ttl: ${tok['ttl'] ?? tok['expiresIn'] ?? '—'}',
            style: theme.textTheme.bodySmall?.copyWith(fontFamily: 'monospace'),
          ),
        ],
      ],
    );
  }
}

class _NumberTile extends StatelessWidget {
  const _NumberTile({required this.n, required this.mine});

  final Map<String, dynamic> n;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final d = n.d;
    final caps = d['capabilities'] is Map ? Map<String, dynamic>.from(d['capabilities']) : {};
    final can = [
      if (caps['voice'] == true) 'voice',
      if (caps['sms'] == true) 'sms',
      if (caps['mms'] == true) 'mms',
    ].join(' · ');
    final assigned = (d['assignedUsers'] as List?)?.join(', ') ?? '';
    // `/phone/user-phones` answers a flat `{id, phoneNumber, friendlyName,
    // assignment}`; `/phone/numbers` answers full records. Same tile, so
    // say what each actually carries.
    final subtitle = d['assignment'] != null
        ? 'assigned to you ${d['assignment'] == 'group' ? 'through a group' : 'directly'}'
        : '${d['provider'] ?? ''} · ${d['status'] ?? ''} · $can'
            '${assigned.isNotEmpty ? ' · assigned: $assigned' : ' · unassigned'}';
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      leading: Icon(mine ? Icons.phone_in_talk : Icons.phone_outlined,
          color: mine ? theme.colorScheme.primary : theme.colorScheme.outline),
      title: Text('${d['phoneNumber']} · ${d['friendlyName'] ?? ''}'),
      subtitle: Text(subtitle),
    );
  }
}
