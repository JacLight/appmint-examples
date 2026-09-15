import 'dart:async';

import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import 'call_log.dart';
import 'crm_api.dart';
import 'screens/contacts_page.dart';
import 'screens/leads_page.dart';
import 'screens/phone_page.dart';
import 'screens/sign_in_page.dart';

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

void main() => runApp(const CrmDemoApp());

/// One client, the member of staff signed into it, the CRM API over it, and
/// a log of every call. No state-management package — the client does not
/// ask for one, and an example should not smuggle that choice into your
/// project.
class DemoState extends ChangeNotifier {
  DemoState() {
    appmint = Appmint(config);
    appmint.http.onCall = log.add;
    api = CrmApi(appmint);
    _sub = appmint.auth.changes.listen((u) {
      user = u;
      notifyListeners();
    });
    appmint.auth.restore();
  }

  late final Appmint appmint;
  late final CrmApi api;
  final log = CallLog();
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

class CrmDemoApp extends StatefulWidget {
  const CrmDemoApp({super.key});

  @override
  State<CrmDemoApp> createState() => _CrmDemoAppState();
}

class _CrmDemoAppState extends State<CrmDemoApp> {
  final state = DemoState();

  @override
  void dispose() {
    state.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Appmint — CRM',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFFB0413E),
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
            body = HomePage(state: state);
          }
          return DemoScaffold(state: state, child: body);
        },
      ),
    );
  }
}

/// Three tabs: the leads you are working, the people you already know, and
/// the phone you reach them with.
class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.state});

  final DemoState state;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = widget.state.user!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 16, 20, 4),
          child: Row(
            children: [
              SegmentedButton<int>(
                segments: const [
                  ButtonSegment(value: 0, label: Text('Leads'), icon: Icon(Icons.flag_outlined, size: 16)),
                  ButtonSegment(value: 1, label: Text('Contacts'), icon: Icon(Icons.people_outline, size: 16)),
                  ButtonSegment(value: 2, label: Text('Phone'), icon: Icon(Icons.phone_outlined, size: 16)),
                ],
                selected: {_tab},
                onSelectionChanged: (s) => setState(() => _tab = s.first),
              ),
              const Spacer(),
              Text(user.email,
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.outline)),
              IconButton(
                tooltip: 'Sign out',
                icon: const Icon(Icons.logout),
                onPressed: widget.state.appmint.auth.signOut,
              ),
            ],
          ),
        ),
        Expanded(
          child: IndexedStack(
            index: _tab,
            children: [
              LeadsPage(state: widget.state),
              ContactsPage(state: widget.state),
              PhonePage(state: widget.state),
            ],
          ),
        ),
      ],
    );
  }
}

/// The screen on the left, what the client did on the right.
class DemoScaffold extends StatelessWidget {
  const DemoScaffold({super.key, required this.state, required this.child});

  final DemoState state;
  final Widget child;

  @override
  Widget build(BuildContext context) {
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
          bottomSheet: Material(
            color: Theme.of(context).colorScheme.surfaceContainerLow,
            child: AnimatedBuilder(
              animation: state.log,
              builder: (context, _) => ExpansionTile(
                title: Text('Requests (${state.log.calls.length})'),
                children: [
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 320),
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
