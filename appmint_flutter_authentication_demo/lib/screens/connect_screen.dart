import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';

/// Step one: tell the client which organization it is talking to.
///
/// These five values are the whole of "machine authentication". After this
/// screen nobody types a header again.
class ConnectScreen extends StatefulWidget {
  const ConnectScreen({super.key, required this.state});

  final DemoState state;

  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> {
  final _baseUrl = TextEditingController(
    text: const String.fromEnvironment(
      'APPMINT_BASE_URL',
      defaultValue: 'https://appengine.appmint.io',
    ),
  );
  final _orgId = TextEditingController(text: 'demo');
  final _appId = TextEditingController(text: 'demo');
  final _appKey = TextEditingController();
  final _appSecret = TextEditingController();

  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_baseUrl, _orgId, _appId, _appKey, _appSecret]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _connect() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    final config = AppmintConfig(
      baseUrl: _baseUrl.text.trim().replaceAll(RegExp(r'/+$'), ''),
      orgId: _orgId.text.trim(),
      appId: _appId.text.trim(),
      appKey: _appKey.text.trim(),
      appSecret: _appSecret.text.trim(),
      logRequests: true,
    );

    try {
      await widget.state.connect(config);
      // Force the app token now rather than on the first real call, so this
      // screen can report a wrong key here instead of on the sign-in screen.
      await widget.state.appmint!.http.appToken();
    } on AppmintException catch (e) {
      widget.state.disconnect();
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Connect to an organization',
                  style: theme.textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                'The app authenticates itself before any person does. Give the '
                'client these once and it handles the app token, the renewals '
                'and the org header on every call.',
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: theme.colorScheme.outline),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _baseUrl,
                decoration: const InputDecoration(labelText: 'Appengine URL'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _orgId,
                decoration: const InputDecoration(
                  labelText: 'Organization id',
                  helperText: 'Sent as orgid on every request',
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _appId,
                decoration: const InputDecoration(labelText: 'App id'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _appKey,
                decoration: const InputDecoration(labelText: 'App key'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _appSecret,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'App secret'),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline,
                        size: 18, color: theme.colorScheme.outline),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'These identify your app; they do not protect it. '
                        'Anyone can read them out of a shipped binary, so treat '
                        'them as a name rather than a password. What protects a '
                        'request is the signed-in person’s token.',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.colorScheme.outline),
                      ),
                    ),
                  ],
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _busy ? null : _connect,
                child: _busy
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Connect'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
