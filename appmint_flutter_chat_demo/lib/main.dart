import 'dart:async';

import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import 'call_log.dart';
import 'screens/sign_in_page.dart';
import 'screens/support_page.dart';
import 'socket_log.dart';

/// Credentials come in at build time, so nothing secret lives in the repository:
///
///   flutter run -d chrome \
///     --dart-define=APPMINT_URL=https://appengine.appmint.io \
///     --dart-define=APPMINT_ORG=your-org \
///     --dart-define=APPMINT_APP_ID=… --dart-define=APPMINT_APP_KEY=… \
///     --dart-define=APPMINT_APP_SECRET=…
const config = AppmintConfig(
  baseUrl: String.fromEnvironment('APPMINT_URL'),
  orgId: String.fromEnvironment('APPMINT_ORG'),
  appId: String.fromEnvironment('APPMINT_APP_ID'),
  appKey: String.fromEnvironment('APPMINT_APP_KEY'),
  appSecret: String.fromEnvironment('APPMINT_APP_SECRET'),
  logRequests: true,
);

void main() => runApp(const ChatDemoApp());

/// One client, the customer signed into it, and two logs: what went over
/// HTTP, and what went over the socket. The socket is the point of this
/// example, and everything that travels on it is otherwise invisible.
class DemoState extends ChangeNotifier {
  DemoState() {
    appmint = Appmint(config);
    appmint.http.onCall = log.add;
    _sub = appmint.auth.changes.listen((u) {
      user = u;
      notifyListeners();
    });
    appmint.auth.restore();
  }

  late final Appmint appmint;
  final log = CallLog();
  final socketLog = SocketLog();
  AppmintUser? user;
  StreamSubscription<AppmintUser?>? _sub;

  bool get configured => config.baseUrl.isNotEmpty && config.appKey.isNotEmpty;

  @override
  void dispose() {
    _sub?.cancel();
    appmint.dispose();
    super.dispose();
  }
}

class ChatDemoApp extends StatefulWidget {
  const ChatDemoApp({super.key});

  @override
  State<ChatDemoApp> createState() => _ChatDemoAppState();
}

class _ChatDemoAppState extends State<ChatDemoApp> {
  final state = DemoState();

  @override
  void dispose() {
    state.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Appmint — Chat',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF6D4AFF),
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
          if (!state.configured) {
            body = const _NotConfigured();
          } else if (state.user == null) {
            body = SignInPage(state: state);
          } else {
            // A new SupportPage per sign-in: the socket belongs to the person,
            // and signing out must tear it down.
            body = SupportPage(key: ValueKey(state.user!.id), state: state);
          }
          return DemoScaffold(state: state, child: body);
        },
      ),
    );
  }
}

/// The screen on the left; on the right, the socket above and HTTP below.
class DemoScaffold extends StatelessWidget {
  const DemoScaffold({super.key, required this.state, required this.child});

  final DemoState state;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final panel = Theme.of(context).colorScheme.surfaceContainerLow;
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 900) {
          return Scaffold(
            body: Row(
              // Stretch, or a page that is a scroll view shrink-wraps its
              // content and the Row centres it halfway down the window.
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: SafeArea(child: child)),
                const VerticalDivider(width: 1),
                SizedBox(
                  width: 400,
                  child: SafeArea(
                    child: Material(
                      color: panel,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(child: SocketLogPanel(log: state.socketLog)),
                          const Divider(height: 1),
                          Expanded(child: CallLogPanel(log: state.log)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        }
        return Scaffold(
          body: SafeArea(child: child),
          bottomSheet: Material(
            color: panel,
            child: AnimatedBuilder(
              animation: Listenable.merge([state.log, state.socketLog]),
              builder: (context, _) => ExpansionTile(
                title: Text('Socket ${state.socketLog.lines.length} · '
                    'Requests ${state.log.calls.length}'),
                children: [
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 200),
                    child: SocketLogPanel(log: state.socketLog),
                  ),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 200),
                    child: CallLogPanel(log: state.log),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _NotConfigured extends StatelessWidget {
  const _NotConfigured();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('No organization configured',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              const Text(
                'This app takes its credentials at build time so none are '
                'committed. Run it with:',
              ),
              const SizedBox(height: 12),
              const SelectableText(
                'flutter run -d chrome \\\n'
                '  --dart-define=APPMINT_URL=https://appengine.appmint.io \\\n'
                '  --dart-define=APPMINT_ORG=your-org \\\n'
                '  --dart-define=APPMINT_APP_ID=your-app-id \\\n'
                '  --dart-define=APPMINT_APP_KEY=your-app-key \\\n'
                '  --dart-define=APPMINT_APP_SECRET=your-app-secret',
                style: TextStyle(fontFamily: 'monospace', fontSize: 12.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
