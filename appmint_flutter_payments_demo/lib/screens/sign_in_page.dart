import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';

/// Staff sign-in. Taking money is a staff action, so
/// this app has no customer path — see the authentication example for both.
class SignInPage extends StatefulWidget {
  const SignInPage({super.key, required this.state});

  final DemoState state;

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  /// Three endings. A verification challenge is a 200 with no token in it;
  /// the sealed result means this switch will not compile with it missing.
  Future<void> _signIn() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    final result = await widget.state.appmint.staff.signIn(
      _email.text.trim(),
      _password.text,
    );
    if (!mounted) return;

    switch (result) {
      case SignedIn():
        break; // the auth stream rebuilds onto the register
      case NeedsVerification(:final challenge):
        setState(() => _busy = false);
        final finished = await showDialog<SignInResult>(
          context: context,
          barrierDismissible: false,
          builder: (_) => _CodeDialog(challenge: challenge),
        );
        if (!mounted) return;
        if (finished is SignInRejected) setState(() => _error = finished.message);
        return;
      case SignInRejected(:final message):
        setState(() => _error = message);
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(28, 40, 28, 120),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Sign in as staff', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 6),
              Text(
                'Taking money is a staff action. '
                'Organization: ${widget.state.appmint.config.orgId}',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.colorScheme.outline),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _password,
                obscureText: true,
                onSubmitted: (_) => _busy ? null : _signIn(),
                decoration: const InputDecoration(labelText: 'Password'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _busy ? null : _signIn,
                child: Text(_busy ? 'Signing in…' : 'Sign in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CodeDialog extends StatefulWidget {
  const _CodeDialog({required this.challenge});

  final VerificationChallenge challenge;

  @override
  State<_CodeDialog> createState() => _CodeDialogState();
}

class _CodeDialogState extends State<_CodeDialog> {
  final _code = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final result = await widget.challenge.verify(_code.text.trim());
    if (!mounted) return;
    switch (result) {
      case SignedIn():
        Navigator.pop(context, result);
      case SignInRejected(:final message):
        setState(() {
          _busy = false;
          _error = message; // the challenge is still alive — try again
        });
      case NeedsVerification():
        setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.challenge;
    return AlertDialog(
      title: const Text('Verification required'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(c.message),
          const SizedBox(height: 12),
          TextField(
            controller: _code,
            autofocus: true,
            enabled: !_busy,
            maxLength: 6,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            decoration:
                const InputDecoration(hintText: '000000', counterText: ''),
          ),
          if (_error != null)
            Text(_error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error)),
          if (c.method.canResend)
            TextButton(
                onPressed: _busy ? null : c.resend,
                child: const Text('Send it again')),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _busy
              ? null
              : () {
                  c.cancel();
                  Navigator.pop(context);
                },
          child: const Text('Cancel'),
        ),
        FilledButton(
            onPressed: _busy ? null : _verify, child: const Text('Verify')),
      ],
    );
  }
}
