import 'dart:async';

import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../crm_api.dart';
import '../main.dart';
import 'reach_sheet.dart';

/// Contacts: the people already in the platform. Search by anything you
/// remember about them; open one for what they have done.
class ContactsPage extends StatefulWidget {
  const ContactsPage({super.key, required this.state});

  final DemoState state;

  @override
  State<ContactsPage> createState() => _ContactsPageState();
}

class _ContactsPageState extends State<ContactsPage> {
  final _search = TextEditingController();
  List<Map<String, dynamic>> _rows = const [];
  Map<String, dynamic>? _selected;
  Map<String, dynamic>? _summary;
  List<Map<String, dynamic>> _events = const [];
  bool _loading = true;
  String? _error;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final q = _search.text.trim();
      final rows = q.isEmpty
          ? await widget.state.api.recentContacts()
          : await widget.state.api.searchContacts(q);
      if (mounted) setState(() => _rows = rows);
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onSearch(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), _load);
  }

  Future<void> _open(Map<String, dynamic> c) async {
    setState(() {
      _selected = c;
      _summary = null;
      _events = const [];
    });
    if (c.email.isEmpty) return;
    try {
      final summary = await widget.state.api.contactSummary(c.email);
      final timeline = await widget.state.api.contactTimeline(c.email);
      if (mounted && _selected == c) {
        setState(() {
          _summary = summary;
          _events = (timeline['events'] as List? ?? const [])
              .whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList();
        });
      }
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          width: 360,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 8, 12, 8),
                child: TextField(
                  controller: _search,
                  onChanged: _onSearch,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Search contacts…',
                    helperText: 'Name, email or company. Empty shows the newest.',
                  ),
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
                        padding: const EdgeInsets.fromLTRB(20, 0, 8, 120),
                        itemCount: _rows.length,
                        itemBuilder: (context, i) {
                          final c = _rows[i];
                          return ListTile(
                            dense: true,
                            selected: identical(c, _selected),
                            leading: CircleAvatar(
                              radius: 14,
                              child: Text(c.displayName[0].toUpperCase(),
                                  style: const TextStyle(fontSize: 12)),
                            ),
                            title: Text(c.displayName),
                            subtitle: Text(c.email, overflow: TextOverflow.ellipsis),
                            onTap: () => _open(c),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
        const VerticalDivider(width: 1),
        Expanded(
          child: _selected == null
              ? Center(
                  child: Text('Pick a contact.',
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(color: theme.colorScheme.outline)),
                )
              : _ContactDetail(
                  state: widget.state,
                  contact: _selected!,
                  summary: _summary,
                  events: _events,
                ),
        ),
      ],
    );
  }
}

class _ContactDetail extends StatelessWidget {
  const _ContactDetail({
    required this.state,
    required this.contact,
    required this.summary,
    required this.events,
  });

  final DemoState state;
  final Map<String, dynamic> contact;
  final Map<String, dynamic>? summary;
  final List<Map<String, dynamic>> events;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final d = contact.d;
    final s = summary;
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 16, 28, 120),
      children: [
        Text(contact.displayName, style: theme.textTheme.headlineSmall),
        const SizedBox(height: 4),
        SelectableText(
          [contact.email, if (contact.phone.isNotEmpty) contact.phone].join(' · '),
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: [
            OutlinedButton.icon(
              onPressed: contact.phone.isEmpty
                  ? null
                  : () => showReachSheet(context, state,
                      name: contact.displayName, phone: contact.phone),
              icon: const Icon(Icons.sms_outlined, size: 18),
              label: Text(contact.phone.isEmpty ? 'No phone on record' : 'Text / call'),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text('Journey', style: theme.textTheme.titleMedium),
        const SizedBox(height: 4),
        Text(
          'What this person has done across the platform — visits, orders, '
          'bookings, chats — keyed by their email.',
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
        ),
        const SizedBox(height: 10),
        if (s == null)
          const LinearProgressIndicator()
        else
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              _Stat('Events', s['totalEvents']),
              _Stat('Sessions', s['totalSessions']),
              _Stat('Engagement', s['engagementScore']),
              _Stat('First seen', _day(s['firstSeen'])),
              _Stat('Last seen', _day(s['lastSeen'])),
            ],
          ),
        const SizedBox(height: 12),
        if (s != null && events.isEmpty)
          Text(
            'No activity recorded. Somebody who has only ever been a record — '
            'typed in, imported, or signed up and never came back — looks like this.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
          )
        else
          for (final e in events)
            ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.circle, size: 8),
              title: Text('${e['type'] ?? e['eventType'] ?? 'event'}'),
              subtitle: Text('${e['timestamp'] ?? e['createdAt'] ?? ''} '
                  '${e['page'] ?? e['title'] ?? e['description'] ?? ''}'),
            ),
        const SizedBox(height: 20),
        Text('Record', style: theme.textTheme.titleMedium),
        const SizedBox(height: 6),
        for (final k in ['firstName', 'lastName', 'company', 'groups', 'createdate'])
          if ((k == 'createdate' ? contact[k] : d[k]) != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  SizedBox(
                    width: 110,
                    child: Text(k,
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.colorScheme.outline)),
                  ),
                  Expanded(
                    child: Text('${k == 'createdate' ? contact[k] : d[k]}',
                        style: theme.textTheme.bodySmall),
                  ),
                ],
              ),
            ),
      ],
    );
  }

  static String _day(dynamic iso) {
    final t = DateTime.tryParse('${iso ?? ''}');
    return t == null ? '—' : '${t.year}-${t.month.toString().padLeft(2, '0')}-${t.day.toString().padLeft(2, '0')}';
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.label, this.value);
  final String label;
  final dynamic value;
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${value ?? 0}', style: theme.textTheme.titleMedium),
          Text(label,
              style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.outline)),
        ],
      ),
    );
  }
}
