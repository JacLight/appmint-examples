import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';

/// Step three: there is a session.
///
/// Proves it by making a call that only works with one — and shows what
/// signing out does, and does not, clear.
class SessionScreen extends StatefulWidget {
  const SessionScreen({super.key, required this.state});

  final DemoState state;

  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen> {
  String? _probe;
  bool _busy = false;

  Appmint get _appmint => widget.state.appmint!;
  AppmintUser get _user => widget.state.user!;

  /// A read that carries the person's token. Watch the "user token" badge on
  /// this one in the request log — it is the difference from every call made
  /// before signing in.
  Future<void> _callAsMe() async {
    setState(() {
      _busy = true;
      _probe = null;
    });
    try {
      final page = await _appmint.repository.find('setting', pageSize: 1);
      if (mounted) {
        setState(() => _probe =
            'Read ${page.items.length} of ${page.total} settings as ${_user.email}.');
      }
    } on AppmintException catch (e) {
      if (mounted) setState(() => _probe = 'Refused: ${e.message}');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(28, 28, 28, 120),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    child: Text(
                      (_user.displayName.isNotEmpty
                              ? _user.displayName[0]
                              : '?')
                          .toUpperCase(),
                      style: theme.textTheme.titleLarge,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_user.displayName,
                            style: theme.textTheme.titleLarge),
                        Text(_user.email,
                            style: theme.textTheme.bodySmall
                                ?.copyWith(color: theme.colorScheme.outline)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Card(
                child: Column(
                  children: [
                    _Row(
                      label: 'Signed in as',
                      value: _user.identity == Identity.staff
                          ? 'Staff'
                          : 'Customer',
                    ),
                    _Row(label: 'Organization', value: _appmint.config.orgId),
                    _Row(label: 'Record id', value: _user.id),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: _busy ? null : _callAsMe,
                icon: const Icon(Icons.play_arrow, size: 18),
                label: const Text('Make a call as this person'),
              ),
              if (_probe != null) ...[
                const SizedBox(height: 10),
                Text(_probe!, style: theme.textTheme.bodySmall),
              ],
              const SizedBox(height: 28),
              Text('Signing out', style: theme.textTheme.titleSmall),
              const SizedBox(height: 6),
              Text(
                'Clears the tokens and the cached person — and nothing else. '
                'Accounts remembered on this device survive on purpose, and so '
                'does anything your app stored: a shared till should not lose '
                'its paired printer because somebody went home.',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.colorScheme.outline),
              ),
              const SizedBox(height: 12),
              FilledButton.tonal(
                onPressed: () => _appmint.auth.signOut(),
                child: const Text('Sign out'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: widget.state.disconnect,
                child: const Text('Disconnect from this organization'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.colorScheme.outline)),
          ),
          Expanded(
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
