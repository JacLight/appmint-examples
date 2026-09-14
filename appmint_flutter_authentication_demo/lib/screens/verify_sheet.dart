import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

/// The third ending of sign-in: a code is needed.
///
/// Stays open on a wrong code — the challenge is still alive and the person is
/// holding the code. Returns the [SignInResult] that ended it, or null if they
/// backed out.
Future<SignInResult?> showVerificationSheet(
  BuildContext context,
  VerificationChallenge challenge,
) {
  return showModalBottomSheet<SignInResult>(
    context: context,
    isScrollControlled: true,
    isDismissible: false,
    enableDrag: false,
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(ctx).viewInsets.bottom,
      ),
      child: _VerifySheet(challenge: challenge),
    ),
  );
}

class _VerifySheet extends StatefulWidget {
  const _VerifySheet({required this.challenge});

  final VerificationChallenge challenge;

  @override
  State<_VerifySheet> createState() => _VerifySheetState();
}

class _VerifySheetState extends State<_VerifySheet> {
  final _code = TextEditingController();
  bool _busy = false;
  String? _error;
  String? _notice;

  VerificationChallenge get challenge => widget.challenge;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  String get _where => switch (challenge.method) {
        VerificationMethod.sms => 'sent by text',
        VerificationMethod.authenticator => 'in your authenticator app',
        VerificationMethod.email =>
          'sent to ${challenge.sentTo ?? 'your email'}',
      };

  Future<void> _verify() async {
    final code = _code.text.trim();
    if (code.length != 6) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    final SignInResult result;
    try {
      result = await challenge.verify(code);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = '$e';
        });
      }
      return;
    }
    if (!mounted) return;

    switch (result) {
      case SignedIn():
        Navigator.pop(context, result);
      case SignInRejected(:final message):
        // The challenge is still good — let them try again with the server's
        // own wording in front of them.
        setState(() {
          _busy = false;
          _error = message;
        });
      case NeedsVerification():
        setState(() => _busy = false);
    }
  }

  Future<void> _send(VerificationMethod? method, String ok) async {
    setState(() {
      _busy = true;
      _notice = null;
    });
    final sent = method == null
        ? await challenge.resend()
        : await challenge.sendByAnotherMethod(method);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _notice = sent ? ok : 'Could not send the code.';
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Verification required', style: theme.textTheme.titleLarge),
          const SizedBox(height: 6),
          Text(
            challenge.isNewDevice
                ? 'This device has not been seen before. Enter the 6-digit code $_where.'
                : 'Enter the 6-digit code $_where.',
            style: theme.textTheme.bodyMedium
                ?.copyWith(color: theme.colorScheme.outline),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: _code,
            autofocus: true,
            enabled: !_busy,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: theme.textTheme.headlineSmall?.copyWith(letterSpacing: 8),
            decoration: const InputDecoration(
              hintText: '000000',
              counterText: '',
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
          ],
          if (_notice != null) ...[
            const SizedBox(height: 10),
            Text(_notice!, style: TextStyle(color: theme.colorScheme.primary)),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 4,
            children: [
              // An authenticator code is computed on the device. There is
              // nothing to resend, so offering it would be a lie.
              if (challenge.method.canResend)
                TextButton(
                  onPressed:
                      _busy ? null : () => _send(null, 'Code sent again.'),
                  child: const Text('Send it again'),
                ),
              // The way out when the second factor lives on a phone that is
              // lost, dead or in another room.
              if (challenge.method != VerificationMethod.email)
                TextButton(
                  onPressed: _busy
                      ? null
                      : () => _send(VerificationMethod.email,
                          'Code sent to your email.'),
                  child: const Text('Email me a code instead'),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: _busy
                    ? null
                    : () {
                        challenge.cancel();
                        Navigator.pop(context);
                      },
                child: const Text('Cancel'),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _busy ? null : _verify,
                child: _busy
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Verify'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
