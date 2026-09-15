import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';

/// Customer sign-in, with an account-creation switch. Support chat is the
/// customer's side of a conversation, so this app has no staff path — the
/// agent answers from the Appmint admin, Appmint Mobile, or a terminal.
class SignInPage extends StatefulWidget {
  const SignInPage({super.key, required this.state});

  final DemoState state;

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  bool _creating = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _name.dispose();
    super.dispose();
  }

  /// Sign-in and sign-up end the same three ways, so one handler covers both.
  Future<void> _go() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    final customers = widget.state.appmint.customers;
    final email = _email.text.trim();
    final result = _creating
        ? await customers.signUp(
            email: email,
            password: _password.text,
            firstName: _name.text.trim().isEmpty ? null : _name.text.trim(),
          )
        : await customers.signIn(email, _password.text);
    if (!mounted) return;

    switch (result) {
      case SignedIn():
        break; // the auth stream rebuilds onto the support page
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
              Text(_creating ? 'Create a customer account' : 'Sign in as a customer',
                  style: theme.textTheme.headlineSmall),
              const SizedBox(height: 6),
              Text(
                'Support chat is the customer\'s side. '
                'Organization: ${widget.state.appmint.config.orgId}',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.colorScheme.outline),
              ),
              const SizedBox(height: 24),
              if (_creating) ...[
                TextField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Your name'),
                ),
                const SizedBox(height: 12),
              ],
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _password,
                obscureText: true,
                onSubmitted: (_) => _busy ? null : _go(),
                decoration: const InputDecoration(labelText: 'Password'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _busy ? null : _go,
                child: Text(_busy
                    ? 'Working…'
                    : _creating
                        ? 'Create account'
                        : 'Sign in'),
              ),
              TextButton(
                onPressed: _busy
                    ? null
                    : () => setState(() {
                          _creating = !_creating;
                          _error = null;
                        }),
                child: Text(_creating
                    ? 'I already have an account'
                    : 'Create an account instead'),
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
