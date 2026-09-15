import 'dart:async';

import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../crm_api.dart';
import '../main.dart';
import 'lead_page.dart';

/// Leads: search, filter by status, open one, make one.
class LeadsPage extends StatefulWidget {
  const LeadsPage({super.key, required this.state});

  final DemoState state;

  @override
  State<LeadsPage> createState() => LeadsPageState();
}

class LeadsPageState extends State<LeadsPage> {
  final _search = TextEditingController();
  List<Map<String, dynamic>> _leads = const [];
  String _status = '';
  bool _loading = true;
  String? _error;
  Timer? _debounce;

  static const statuses = [
    '', 'new', 'contacted', 'qualified', 'unqualified', 'disqualified',
    'converted', 'lost', 'nurturing', 'follow_up',
  ];

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    _search.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await widget.state.api
          .listLeads(search: _search.text.trim(), status: _status);
      if (mounted) setState(() => _leads = rows);
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onSearch(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), load);
  }

  Future<void> _open(Map<String, dynamic> lead) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DemoScaffold(
          state: widget.state,
          child: LeadPage(state: widget.state, leadId: lead.id),
        ),
      ),
    );
    load(); // whatever happened in there, the row may have changed
  }

  Future<void> _create() async {
    final made = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (_) => _NewLeadDialog(state: widget.state),
    );
    if (made != null && mounted) {
      await load();
      _open(made);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 8, 28, 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _search,
                  onChanged: _onSearch,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Search leads by name, email or company',
                  ),
                ),
              ),
              const SizedBox(width: 12),
              DropdownButton<String>(
                value: _status,
                items: [
                  for (final s in statuses)
                    DropdownMenuItem(value: s, child: Text(s.isEmpty ? 'Any status' : s)),
                ],
                onChanged: (v) {
                  setState(() => _status = v ?? '');
                  load();
                },
              ),
              const SizedBox(width: 12),
              FilledButton.icon(
                onPressed: _create,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('New lead'),
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
              : _leads.isEmpty
                  ? Center(
                      child: Text('No leads match.',
                          style: theme.textTheme.bodyMedium
                              ?.copyWith(color: theme.colorScheme.outline)),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                      itemCount: _leads.length,
                      itemBuilder: (context, i) {
                        final lead = _leads[i];
                        final d = lead.d;
                        return Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              child: Text(lead.displayName.isEmpty
                                  ? '?'
                                  : lead.displayName[0].toUpperCase()),
                            ),
                            title: Text(lead.displayName),
                            subtitle: Text([
                              if ((d['company'] ?? '').toString().isNotEmpty) d['company'],
                              if (lead.email.isNotEmpty) lead.email,
                            ].join(' · ')),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                StatusChip(status: '${d['status'] ?? 'new'}'),
                                const SizedBox(width: 8),
                                Text('${d['score'] ?? 0}',
                                    style: theme.textTheme.labelLarge),
                                const SizedBox(width: 4),
                                const Icon(Icons.chevron_right),
                              ],
                            ),
                            onTap: () => _open(lead),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}

/// The same eight words the CRM uses, in colour.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final colour = switch (status) {
      'qualified' => const Color(0xFF1E6FD9),
      'converted' => const Color(0xFF0B7A75),
      'contacted' || 'nurturing' || 'follow_up' => const Color(0xFFD98C1E),
      'unqualified' || 'disqualified' || 'lost' => Theme.of(context).colorScheme.error,
      _ => Theme.of(context).colorScheme.outline,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: colour.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(status,
          style: TextStyle(color: colour, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

/// New lead — and, before you save it, whether it already exists. A duplicate
/// lead splits one person's history across two records and makes both look
/// cold, so the dialog searches as you type the email.
class _NewLeadDialog extends StatefulWidget {
  const _NewLeadDialog({required this.state});

  final DemoState state;

  @override
  State<_NewLeadDialog> createState() => _NewLeadDialogState();
}

class _NewLeadDialogState extends State<_NewLeadDialog> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _company = TextEditingController();
  String _source = 'phone';
  List<Map<String, dynamic>> _matches = const [];
  Timer? _debounce;
  bool _busy = false;
  String? _error;

  static const sources = [
    'website', 'referral', 'facebook', 'linkedin', 'instagram', 'email',
    'phone', 'event', 'partner', 'other',
  ];

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _company.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _lookAlike(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () async {
      final q = _email.text.trim().isNotEmpty ? _email.text.trim() : _name.text.trim();
      if (q.length < 3) {
        if (mounted) setState(() => _matches = const []);
        return;
      }
      try {
        final rows = await widget.state.api.listLeads(search: q, pageSize: 5);
        if (mounted) setState(() => _matches = rows);
      } on AppmintException {
        // a failed lookup is not a reason to block creating the lead
      }
    });
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'A name, at least.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final made = await widget.state.api.createLead(
        fullName: _name.text.trim(),
        email: _email.text.trim().isEmpty ? null : _email.text.trim(),
        phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        company: _company.text.trim().isEmpty ? null : _company.text.trim(),
        source: _source,
      );
      if (mounted) Navigator.pop(context, made);
    } on AppmintException catch (e) {
      // "Invalid email format" is the one thing the server refuses.
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
    final theme = Theme.of(context);
    return AlertDialog(
      title: const Text('New lead'),
      content: SizedBox(
        width: 420,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _name,
              autofocus: true,
              onChanged: _lookAlike,
              decoration: const InputDecoration(labelText: 'Full name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _email,
              onChanged: _lookAlike,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _company,
                  decoration: const InputDecoration(labelText: 'Company'),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _source,
              decoration: const InputDecoration(labelText: 'Source'),
              items: [for (final s in sources) DropdownMenuItem(value: s, child: Text(s))],
              onChanged: (v) => setState(() => _source = v ?? _source),
            ),
            if (_matches.isNotEmpty) ...[
              const SizedBox(height: 14),
              Text('Already in the CRM?',
                  style: theme.textTheme.labelLarge
                      ?.copyWith(color: const Color(0xFFD98C1E))),
              for (final m in _matches)
                ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.warning_amber, color: Color(0xFFD98C1E), size: 18),
                  title: Text(m.displayName),
                  subtitle: Text('${m.email} · ${m.d['status'] ?? ''}'),
                  onTap: () => Navigator.pop(context, m),
                ),
              Text('Tap one to open it instead of making a second record.',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.outline)),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
            onPressed: _busy ? null : () => Navigator.pop(context),
            child: const Text('Cancel')),
        FilledButton(
            onPressed: _busy ? null : _save,
            child: Text(_busy ? 'Saving…' : 'Create')),
      ],
    );
  }
}
