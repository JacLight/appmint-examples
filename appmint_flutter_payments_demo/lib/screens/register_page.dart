import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';
import '../payments_api.dart';
import 'tab_page.dart';

/// The register: open tabs, and a way to open one.
class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key, required this.state});

  final DemoState state;

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  List<Map<String, dynamic>> _tabs = const [];
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
      final rows = await widget.state.api.openTabs();
      // Newest first — the server's list is not ordered for a register.
      rows.sort((a, b) => '${b['createdate']}'.compareTo('${a['createdate']}'));
      if (mounted) setState(() => _tabs = rows);
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _open(String id) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DemoScaffold(
          state: widget.state,
          child: TabPage(state: widget.state, tabId: id),
        ),
      ),
    );
    _load();
  }

  Future<void> _newTab() async {
    try {
      final tab = await widget.state.api.openTab();
      if (mounted) _open(tab.id);
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = widget.state.user!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 24, 20, 8),
          child: Row(
            children: [
              Expanded(child: Text('Register', style: theme.textTheme.headlineSmall)),
              Text(user.email,
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
              IconButton(
                tooltip: 'Sign out',
                icon: const Icon(Icons.logout),
                onPressed: widget.state.appmint.auth.signOut,
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 0, 28, 12),
          child: Row(
            children: [
              FilledButton.icon(
                onPressed: _newTab,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('New tab'),
              ),
              const SizedBox(width: 8),
              IconButton(tooltip: 'Refresh', onPressed: _load, icon: const Icon(Icons.refresh)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'A tab is an order. Add items, then take money against it — one tender at a time.',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
                ),
              ),
            ],
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
          ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                  itemCount: _tabs.length,
                  itemBuilder: (context, i) {
                    final t = _tabs[i];
                    return Card(
                      child: ListTile(
                        leading: Icon(
                          t.status == 'paid' ? Icons.check_circle : Icons.receipt_long_outlined,
                          color: t.status == 'paid' ? theme.colorScheme.primary : theme.colorScheme.outline,
                        ),
                        title: Text(t.alias),
                        subtitle: Text('${t.items.length} item${t.items.length == 1 ? '' : 's'} · ${t.status}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(money(t.amount), style: theme.textTheme.titleMedium),
                            if (t.due > 0) ...[
                              const SizedBox(width: 8),
                              Text('${money(t.due)} due',
                                  style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFFD98C1E))),
                            ],
                            const SizedBox(width: 4),
                            const Icon(Icons.chevron_right),
                          ],
                        ),
                        onTap: () => _open(t.id),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
