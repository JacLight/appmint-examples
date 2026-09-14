import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';
import 'verify_sheet.dart';

/// Step two: sign somebody in.
///
/// Two kinds of people, four ways in, and one ending that is neither success
/// nor failure.
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key, required this.state});

  final DemoState state;

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _employeeId = TextEditingController();
  final _pin = TextEditingController();

  Identity _identity = Identity.customer;
  bool _busy = false;
  String? _error;
  String? _notice;
  List<SavedSession> _saved = const [];

  Appmint get _appmint => widget.state.appmint!;
  IdentityAuth get _who =>
      _identity == Identity.staff ? _appmint.staff : _appmint.customers;

  @override
  void initState() {
    super.initState();
    _loadSaved();
  }

  @override
  void dispose() {
    for (final c in [_email, _password, _employeeId, _pin]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadSaved() async {
    final saved = await _appmint.auth.savedSessions();
    if (mounted) setState(() => _saved = saved);
  }

  /// The one piece of this demo worth copying verbatim.
  ///
  /// Sign-in has three endings. A verification challenge is not an error and
  /// not a session — it is a 200 with no token in it. Handling it is not
  /// optional here: the switch will not compile with a case missing.
  Future<void> _handle(Future<SignInResult> attempt) async {
    setState(() {
      _busy = true;
      _error = null;
      _notice = null;
    });

    final SignInResult result;
    try {
      result = await attempt;
    } catch (e) {
      // Nothing should reach here — the client turns refusals into results —
      // but a demo that spins forever teaches nothing, so say what happened.
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
        // Nothing to do — the client emitted the new session and the app
        // rebuilds onto the session screen.
        break;

      case NeedsVerification(:final challenge):
        setState(() => _busy = false);
        final finished = await showVerificationSheet(context, challenge);
        if (!mounted) return;
        if (finished is SignInRejected) {
          setState(() => _error = finished.message);
        }
        await _loadSaved();
        return;

      case SignInRejected(:final message):
        setState(() => _error = message);
    }

    if (mounted) {
      setState(() => _busy = false);
      await _loadSaved();
    }
  }

  Future<void> _magicCode() async {
    final email = _email.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Enter the email address first.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final sent = await _who.sendMagicCode(email);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _notice = sent
          ? 'A six-digit code is on its way to $email.'
          : 'Could not send a code to $email.';
    });
    if (!sent) return;

    final code = await _askForCode(context);
    if (code == null || !mounted) return;
    await _handle(_who.verifyMagicCode(email, code));
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
                  Expanded(
                    child: Text('Sign in', style: theme.textTheme.headlineSmall),
                  ),
                  TextButton.icon(
                    onPressed: widget.state.disconnect,
                    icon: const Icon(Icons.swap_horiz, size: 18),
                    label: Text(_appmint.config.orgId),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Two identities, kept visible. They are different records on the
              // server with different sign-in routes — not one user type with a
              // flag, and not interchangeable.
              SegmentedButton<Identity>(
                segments: const [
                  ButtonSegment(
                    value: Identity.customer,
                    label: Text('Customer'),
                    icon: Icon(Icons.person_outline, size: 18),
                  ),
                  ButtonSegment(
                    value: Identity.staff,
                    label: Text('Staff'),
                    icon: Icon(Icons.badge_outlined, size: 18),
                  ),
                ],
                selected: {_identity},
                onSelectionChanged: (s) => setState(() => _identity = s.first),
              ),
              const SizedBox(height: 6),
              Text(
                _identity == Identity.customer
                    ? 'The people you serve — guests, buyers, attendees.'
                    : 'Employees, managers and administrators.',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.colorScheme.outline),
              ),
              const SizedBox(height: 20),

              if (_saved.isNotEmpty) ...[
                Text('Remembered on this device',
                    style: theme.textTheme.titleSmall),
                const SizedBox(height: 8),
                ..._saved.map(
                  (s) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      dense: true,
                      leading: const Icon(Icons.history),
                      title: Text(s.name ?? s.email),
                      subtitle: Text(
                        s.expired
                            ? 'Session expired — password needed'
                            : '${s.email} · ${s.identity.name}',
                      ),
                      trailing: IconButton(
                        tooltip: 'Forget',
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () async {
                          await _appmint.auth.forgetSession(s.email, s.orgId);
                          await _loadSaved();
                        },
                      ),
                      onTap: _busy
                          ? null
                          : () => _handle(_appmint.auth.signInWithSaved(s)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
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
                decoration: const InputDecoration(labelText: 'Password'),
              ),

              if (_error != null) ...[
                const SizedBox(height: 14),
                Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
              ],
              if (_notice != null) ...[
                const SizedBox(height: 14),
                Text(_notice!,
                    style: TextStyle(color: theme.colorScheme.primary)),
              ],

              const SizedBox(height: 18),
              FilledButton(
                onPressed: _busy
                    ? null
                    : () => _handle(
                          _who.signIn(_email.text.trim(), _password.text),
                        ),
                child: _busy
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Sign in'),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _busy ? null : _magicCode,
                icon: const Icon(Icons.mail_outline, size: 18),
                label: const Text('Email me a code instead'),
              ),

              if (_identity == Identity.staff) ...[
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 8),
                Text('Shared device', style: theme.textTheme.titleSmall),
                const SizedBox(height: 4),
                Text(
                  'A till or a door scanner is used by many people in a shift. '
                  'Passcode sign-in skips verification challenges on purpose, '
                  'so a queue is never held up — which also makes it the way '
                  'back in when an organization has just switched 2FA on.',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.outline),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _employeeId,
                        decoration:
                            const InputDecoration(labelText: 'Employee id'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    SizedBox(
                      width: 130,
                      child: TextField(
                        controller: _pin,
                        obscureText: true,
                        maxLength: 6,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Passcode',
                          counterText: '',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: _busy
                      ? null
                      : () => _handle(
                            _appmint.staff.signInWithPasscode(
                              employeeId: _employeeId.text.trim(),
                              pin: _pin.text.trim(),
                            ),
                          ),
                  child: const Text('Sign in with passcode'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

Future<String?> _askForCode(BuildContext context) {
  final controller = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Enter the code'),
      content: TextField(
        controller: controller,
        autofocus: true,
        keyboardType: TextInputType.number,
        maxLength: 6,
        textAlign: TextAlign.center,
        decoration: const InputDecoration(hintText: '000000', counterText: ''),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        FilledButton(
          onPressed: () => Navigator.pop(ctx, controller.text.trim()),
          child: const Text('Verify'),
        ),
      ],
    ),
  );
}
