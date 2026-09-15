import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../crm_api.dart';
import '../main.dart';
import 'leads_page.dart';
import 'reach_sheet.dart';

/// One lead: who they are, what has happened, and the actions that move it.
///
/// Every action here is one request, and every one of them writes a
/// `lead_activity` record — which is why the timeline underneath explains
/// itself later without anyone typing it up.
class LeadPage extends StatefulWidget {
  const LeadPage({super.key, required this.state, required this.leadId});

  final DemoState state;
  final String leadId;

  @override
  State<LeadPage> createState() => _LeadPageState();
}

class _LeadPageState extends State<LeadPage> {
  Map<String, dynamic>? _lead;
  List<TimelineEntry> _timeline = const [];
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final lead = await widget.state.api.getLead(widget.leadId);
      final timeline = await widget.state.api.leadTimeline(widget.leadId, lead.d);
      if (mounted) {
        setState(() {
          _lead = lead;
          _timeline = timeline;
          _error = null;
        });
      }
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  /// Run one action, then reload — the server's answer is the truth, not
  /// whatever we would have guessed the new status to be.
  Future<void> _act(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
      await _load();
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<String?> _ask(String title, String label, {String? initial}) =>
      showDialog<String>(
        context: context,
        builder: (_) => _TextDialog(title: title, label: label, initial: initial),
      );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lead = _lead;
    final api = widget.state.api;
    final me = widget.state.user!.email;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 16, 20, 4),
          child: Row(
            children: [
              IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => Navigator.pop(context)),
              Expanded(
                child: Text(lead?.displayName ?? '…',
                    style: theme.textTheme.headlineSmall),
              ),
              if (lead != null) StatusChip(status: '${lead.d['status'] ?? 'new'}'),
            ],
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 4, 28, 0),
            child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
          ),
        if (lead == null)
          const Expanded(child: Center(child: CircularProgressIndicator()))
        else
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(28, 8, 28, 120),
              children: [
                _Facts(lead: lead),
                const SizedBox(height: 16),
                // Reaching the person goes through the organization's
                // numbers, not the device's own. The sheet says which.
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton.icon(
                      onPressed: lead.phone.isEmpty
                          ? null
                          : () => showReachSheet(context, widget.state,
                              name: lead.displayName, phone: lead.phone),
                      icon: const Icon(Icons.sms_outlined, size: 18),
                      label: const Text('Text / call'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _busy
                          ? null
                          : () async {
                              final text = await _ask('Add a note', 'What happened?');
                              if (text != null && text.isNotEmpty) {
                                _act(() => api.addNote(widget.leadId, text));
                              }
                            },
                      icon: const Icon(Icons.note_add_outlined, size: 18),
                      label: const Text('Note'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text('Move it along', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.tonal(
                      onPressed: _busy
                          ? null
                          : () async {
                              final notes = await _ask('Qualify', 'Why? (optional)');
                              if (notes != null) {
                                _act(() => api.qualify(widget.leadId,
                                    notes: notes.isEmpty ? null : notes));
                              }
                            },
                      child: const Text('Qualify'),
                    ),
                    FilledButton.tonal(
                      onPressed: _busy
                          ? null
                          : () async {
                              final reason = await _ask('Disqualify', 'Reason (optional)');
                              if (reason != null) {
                                _act(() => api.disqualify(widget.leadId,
                                    reason: reason.isEmpty ? null : reason));
                              }
                            },
                      child: const Text('Disqualify'),
                    ),
                    FilledButton.tonal(
                      onPressed: _busy
                          ? null
                          : () async {
                              final to = await _ask('Assign to', 'Staff email', initial: me);
                              if (to != null && to.isNotEmpty) {
                                _act(() => api.assign(widget.leadId, to));
                              }
                            },
                      child: const Text('Assign'),
                    ),
                    FilledButton.tonal(
                      onPressed: _busy
                          ? null
                          : () async {
                              final when = await showDatePicker(
                                context: context,
                                initialDate: DateTime.now().add(const Duration(days: 2)),
                                firstDate: DateTime.now(),
                                lastDate: DateTime.now().add(const Duration(days: 365)),
                              );
                              if (when == null || !context.mounted) return;
                              final notes = await _ask('Follow up', 'About what? (optional)');
                              if (notes != null) {
                                _act(() => api.scheduleFollowUp(
                                    widget.leadId,
                                    DateTime(when.year, when.month, when.day, 10),
                                    notes: notes.isEmpty ? null : notes));
                              }
                            },
                      child: const Text('Follow up'),
                    ),
                    FilledButton(
                      onPressed: _busy
                          ? null
                          : () async {
                              final v = await _ask('Convert', 'Deal value (optional)');
                              if (v != null) {
                                _act(() => api.convert(widget.leadId,
                                    value: num.tryParse(v)));
                              }
                            },
                      child: const Text('Convert'),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text('Timeline', style: theme.textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'Actions are lead_activity records the server wrote; notes are '
                  'stored on the lead itself. Oldest first.',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.outline),
                ),
                const SizedBox(height: 8),
                if (_timeline.isEmpty)
                  Text('Nothing yet.',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.colorScheme.outline))
                else
                  for (final t in _timeline) _TimelineRow(entry: t),
              ],
            ),
          ),
      ],
    );
  }
}

/// One text field and OK. A StatefulWidget so the controller outlives the
/// dialog's closing animation — disposing it the moment the dialog pops
/// (the obvious way) trips a framework assertion on the way out.
class _TextDialog extends StatefulWidget {
  const _TextDialog({required this.title, required this.label, this.initial});

  final String title;
  final String label;
  final String? initial;

  @override
  State<_TextDialog> createState() => _TextDialogState();
}

class _TextDialogState extends State<_TextDialog> {
  late final TextEditingController _c = TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: SizedBox(
        width: 380,
        child: TextField(
          controller: _c,
          autofocus: true,
          maxLines: 3,
          minLines: 1,
          decoration: InputDecoration(labelText: widget.label),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        FilledButton(
            onPressed: () => Navigator.pop(context, _c.text.trim()),
            child: const Text('OK')),
      ],
    );
  }
}

class _Facts extends StatelessWidget {
  const _Facts({required this.lead});

  final Map<String, dynamic> lead;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final d = lead.d;
    String s(dynamic v) => (v == null || '$v'.isEmpty) ? '—' : '$v';
    final rows = <(String, String)>[
      ('Email', s(d['email'])),
      ('Phone', s(d['phone'])),
      ('Company', s(d['company'])),
      ('Source', s(d['source'])),
      ('Score', '${d['score'] ?? 0} · ${d['temperature'] ?? ''}'),
      ('Assigned to', s(d['assignedTo'])),
      ('Next follow-up', s(d['nextFollowUpAt'])),
      ('Notes', s(d['notes'])),
      if (d['conversionValue'] != null) ('Deal value', '${d['conversionValue']}'),
    ];
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          for (final (k, v) in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 120,
                    child: Text(k,
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.colorScheme.outline)),
                  ),
                  Expanded(child: SelectableText(v, style: theme.textTheme.bodyMedium)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({required this.entry});

  final TimelineEntry entry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final icon = switch (entry.kind) {
      'lead_created' => Icons.add_circle_outline,
      'lead_qualified' => Icons.verified_outlined,
      'lead_disqualified' => Icons.block,
      'lead_assigned' => Icons.person_add_alt,
      'follow_up_scheduled' => Icons.event_outlined,
      'lead_converted' => Icons.emoji_events_outlined,
      'note' => Icons.sticky_note_2_outlined,
      _ => Icons.edit_outlined,
    };
    final t = entry.at.toLocal();
    final stamp = '${t.year}-${t.month.toString().padLeft(2, '0')}-'
        '${t.day.toString().padLeft(2, '0')} '
        '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.text.isEmpty ? entry.kind : entry.text,
                    style: theme.textTheme.bodyMedium),
                Text([entry.kind, if (entry.who.isNotEmpty) entry.who, stamp].join(' · '),
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.colorScheme.outline)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
