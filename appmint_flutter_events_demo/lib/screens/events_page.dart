import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';
import 'event_page.dart';

/// Your events, and a way to make one.
class EventsPage extends StatefulWidget {
  const EventsPage({super.key, required this.state});

  final DemoState state;

  @override
  State<EventsPage> createState() => _EventsPageState();
}

class _EventsPageState extends State<EventsPage> {
  List<Map<String, dynamic>> _events = const [];
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
      final rows = await widget.state.api.listEvents();
      rows.sort((a, b) => (b['createdate'] ?? '').toString()
          .compareTo((a['createdate'] ?? '').toString()));
      if (mounted) setState(() => _events = rows);
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _create() async {
    final made = await showDialog<bool>(
      context: context,
      builder: (_) => _NewEventDialog(state: widget.state),
    );
    if (made == true) _load();
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
              Expanded(
                child: Text('Events', style: theme.textTheme.headlineSmall),
              ),
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
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 0, 28, 12),
          child: Row(
            children: [
              FilledButton.icon(
                onPressed: _create,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('New event'),
              ),
              const SizedBox(width: 8),
              IconButton(
                  tooltip: 'Refresh',
                  onPressed: _load,
                  icon: const Icon(Icons.refresh)),
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
              : _events.isEmpty
                  ? Center(
                      child: Text(
                        'No events yet. Make one.',
                        style: theme.textTheme.bodyMedium
                            ?.copyWith(color: theme.colorScheme.outline),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                      itemCount: _events.length,
                      itemBuilder: (context, i) {
                        final ev = _events[i];
                        final d = Map<String, dynamic>.from(ev['data'] ?? {});
                        final id = (ev['sk'] ?? d['id'] ?? '').toString();
                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.event),
                            title: Text((d['title'] ?? d['name'] ?? id).toString()),
                            subtitle: Text(
                              '${_when(d['startTime'] ?? d['startDate'])} · '
                              '${d['status'] ?? 'draft'}',
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => DemoScaffold(
                                  state: widget.state,
                                  child: EventPage(
                                    state: widget.state,
                                    eventId: id,
                                    event: d,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  static String _when(dynamic iso) {
    final t = DateTime.tryParse(iso?.toString() ?? '');
    if (t == null) return 'no date';
    final l = t.toLocal();
    return '${l.year}-${l.month.toString().padLeft(2, '0')}-'
        '${l.day.toString().padLeft(2, '0')} '
        '${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}';
  }
}

class _NewEventDialog extends StatefulWidget {
  const _NewEventDialog({required this.state});

  final DemoState state;

  @override
  State<_NewEventDialog> createState() => _NewEventDialogState();
}

class _NewEventDialogState extends State<_NewEventDialog> {
  final _title = TextEditingController();
  final _capacity = TextEditingController(text: '100');
  DateTime _start = DateTime.now().add(const Duration(days: 7));
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _title.dispose();
    _capacity.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty) {
      setState(() => _error = 'Give it a title.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.state.api.createEvent(
        title: _title.text.trim(),
        start: _start,
        end: _start.add(const Duration(hours: 4)),
        capacity: int.tryParse(_capacity.text),
      );
      if (mounted) Navigator.pop(context, true);
    } on AppmintException catch (e) {
      // The server's own wording. "event starttime must be in the future" is
      // the one you will hit if you pick a date that has passed.
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('New event'),
      content: SizedBox(
        width: 380,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _title,
              autofocus: true,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.calendar_today, size: 16),
                    label: Text('${_start.year}-${_start.month}-${_start.day}'),
                    onPressed: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _start,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 730)),
                      );
                      if (picked != null) {
                        setState(() => _start = DateTime(
                            picked.year, picked.month, picked.day, 18));
                      }
                    },
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 110,
                  child: TextField(
                    controller: _capacity,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Capacity'),
                  ),
                ),
              ],
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
            onPressed: _busy ? null : () => Navigator.pop(context, false),
            child: const Text('Cancel')),
        FilledButton(
            onPressed: _busy ? null : _save,
            child: Text(_busy ? 'Creating…' : 'Create')),
      ],
    );
  }
}
