import 'dart:async';

import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import 'call_log.dart';
import 'screens/connect_screen.dart';
import 'screens/session_screen.dart';
import 'screens/sign_in_screen.dart';

void main() => runApp(const AuthDemoApp());

/// Everything this demo holds: one client, one call log, one session.
///
/// No state-management package on purpose — the client does not ask for one,
/// and a demo should not smuggle an opinion about that into your project.
class DemoState extends ChangeNotifier {
  Appmint? _appmint;
  AppmintUser? _user;
  StreamSubscription<AppmintUser?>? _sub;

  final log = CallLog();

  Appmint? get appmint => _appmint;
  AppmintUser? get user => _user;
  bool get connected => _appmint != null;

  /// Point at an organization. Nothing has been called yet — the app token is
  /// fetched lazily on the first real request, which is what you will see in
  /// the log.
  Future<void> connect(AppmintConfig config) async {
    await _sub?.cancel();
    _appmint?.dispose();

    final appmint = Appmint(config);
    appmint.http.onCall = log.add;

    _appmint = appmint;
    _user = await appmint.auth.restore();
    _sub = appmint.auth.changes.listen((u) {
      _user = u;
      notifyListeners();
    });
    notifyListeners();
  }

  void disconnect() {
    _sub?.cancel();
    _appmint?.dispose();
    _appmint = null;
    _user = null;
    log.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    _sub?.cancel();
    _appmint?.dispose();
    super.dispose();
  }
}

class AuthDemoApp extends StatefulWidget {
  const AuthDemoApp({super.key});

  @override
  State<AuthDemoApp> createState() => _AuthDemoAppState();
}

class _AuthDemoAppState extends State<AuthDemoApp> {
  final state = DemoState();

  @override
  void dispose() {
    state.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Appmint — Authentication',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF3B5BDB),
        useMaterial3: true,
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
          isDense: true,
        ),
      ),
      home: AnimatedBuilder(
        animation: state,
        builder: (context, _) {
          final Widget body;
          if (!state.connected) {
            body = ConnectScreen(state: state);
          } else if (state.user == null) {
            body = SignInScreen(state: state);
          } else {
            body = SessionScreen(state: state);
          }
          return DemoScaffold(state: state, child: body);
        },
      ),
    );
  }
}

/// The screen on the left, what the client did on the right.
///
/// Side by side on anything wide enough, stacked on a phone.
class DemoScaffold extends StatelessWidget {
  const DemoScaffold({super.key, required this.state, required this.child});

  final DemoState state;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth > 900;

        if (wide) {
          return Scaffold(
            body: Row(
              // Stretch, or a page that is a scroll view shrink-wraps its
              // content and the Row centres it halfway down the window.
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: SafeArea(child: child)),
                const VerticalDivider(width: 1),
                SizedBox(
                  width: 380,
                  child: SafeArea(
                    child: Material(
                      color: Theme.of(context).colorScheme.surfaceContainerLow,
                      child: CallLogPanel(log: state.log),
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        return Scaffold(
          body: SafeArea(child: child),
          bottomSheet: _CollapsedLog(log: state.log),
        );
      },
    );
  }
}

class _CollapsedLog extends StatelessWidget {
  const _CollapsedLog({required this.log});

  final CallLog log;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: log,
      builder: (context, _) => Material(
        color: Theme.of(context).colorScheme.surfaceContainerLow,
        child: ExpansionTile(
          title: Text('Requests (${log.calls.length})'),
          childrenPadding: EdgeInsets.zero,
          children: [
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 320),
              child: CallLogPanel(log: log),
            ),
          ],
        ),
      ),
    );
  }
}
