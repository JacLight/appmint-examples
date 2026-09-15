import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../main.dart';
import 'door_page.dart';

/// One event: its ticket types, its tickets, and the way to the door.
class EventPage extends StatefulWidget {
  const EventPage({
    super.key,
    required this.state,
    required this.eventId,
    required this.event,
  });

  final DemoState state;
  final String eventId;
  final Map<String, dynamic> event;

  @override
  State<EventPage> createState() => _EventPageState();
}

class _EventPageState extends State<EventPage> {
  List<Map<String, dynamic>> _types = const [];
  List<Map<String, dynamic>> _tickets = const [];
  String? _error;
  String? _notice;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final types = await widget.state.api.listTicketTypes(widget.eventId);
      final tickets = await widget.state.api.listTickets(widget.eventId);
      if (mounted) {
        setState(() {
          _types = types;
          _tickets = tickets;
          _error = null;
        });
      }
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  Future<void> _addType() async {
    final name = TextEditingController(text: 'General Admission');
    final price = TextEditingController(text: '25');
    final qty = TextEditingController(text: '100');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New ticket type'),
        content: SizedBox(
          width: 360,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Name')),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                    child: TextField(
                        controller: price,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Price'))),
                const SizedBox(width: 12),
                Expanded(
                    child: TextField(
                        controller: qty,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'Capacity'))),
              ]),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Add')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await widget.state.api.createTicketType(
        eventId: widget.eventId,
        name: name.text.trim(),
        price: num.tryParse(price.text) ?? 0,
        capacity: int.tryParse(qty.text) ?? 0,
      );
      await _load();
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  Future<void> _issue() async {
    if (_types.isEmpty) {
      // The single most common reason issuing "does nothing": nothing to
      // issue against. Say it rather than let the server say it obliquely.
      setState(() => _error =
          'This event has no ticket type. Add one first — nothing can be issued without it.');
      return;
    }
    final holder = TextEditingController();
    final email = TextEditingController();
    var typeId = (_types.first['sk'] ?? _types.first['data']?['id'] ?? '').toString();

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text('Issue a ticket'),
          content: SizedBox(
            width: 380,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: typeId,
                  decoration: const InputDecoration(labelText: 'Ticket type'),
                  items: [
                    for (final t in _types)
                      DropdownMenuItem(
                        value: (t['sk'] ?? t['data']?['id'] ?? '').toString(),
                        child: Text(_typeLabel(t)),
                      ),
                  ],
                  onChanged: (v) => setLocal(() => typeId = v ?? typeId),
                ),
                const SizedBox(height: 12),
                TextField(
                    controller: holder,
                    decoration: const InputDecoration(labelText: 'Holder name')),
                const SizedBox(height: 12),
                TextField(
                    controller: email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Holder email')),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel')),
            FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Issue')),
          ],
        ),
      ),
    );
    if (ok != true) return;

    try {
      final ticket = await widget.state.api.issueTicket(
        eventId: widget.eventId,
        ticketTypeId: typeId,
        holderName: holder.text.trim(),
        holderEmail: email.text.trim(),
      );
      final code = (ticket['data']?['code'] ?? ticket['code'] ?? '').toString();
      setState(() {
        _error = null;
        _notice = 'Ticket issued. Code: $code';
      });
      await _load();
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  static String _typeLabel(Map<String, dynamic> t) {
    final d = Map<String, dynamic>.from(t['data'] ?? t);
    // capacity − soldCount is what the server checks before issuing; a type
    // with no capacity is unlimited.
    final cap = d['capacity'];
    final left = cap is num
        ? ' · ${cap - ((d['soldCount'] as num?) ?? 0)} left'
        : ' · unlimited';
    return '${d['title'] ?? d['name']} · \$${d['price'] ?? 0}$left';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final d = widget.event;

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
                child: Text((d['title'] ?? d['name'] ?? '').toString(),
                    style: theme.textTheme.headlineSmall),
              ),
              FilledButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => DemoScaffold(
                      state: widget.state,
                      child: DoorPage(
                          state: widget.state,
                          eventId: widget.eventId,
                          title: (d['title'] ?? '').toString()),
                    ),
                  ),
                ),
                icon: const Icon(Icons.qr_code_scanner, size: 18),
                label: const Text('Open the door'),
              ),
            ],
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 4, 28, 0),
            child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
          ),
        if (_notice != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 4, 28, 0),
            child: SelectableText(_notice!,
                style: TextStyle(color: theme.colorScheme.primary)),
          ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(28, 8, 28, 120),
            children: [
              _SectionHeader(
                title: 'Ticket types',
                action: TextButton.icon(
                    onPressed: _addType,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add')),
              ),
              if (_types.isEmpty)
                _Empty('No ticket types. Nothing can be issued until there is one.')
              else
                for (final t in _types)
                  ListTile(
                      dense: true,
                      leading: const Icon(Icons.confirmation_number_outlined),
                      title: Text(_typeLabel(t))),
              const SizedBox(height: 16),
              _SectionHeader(
                title: 'Tickets (${_tickets.length})',
                action: TextButton.icon(
                    onPressed: _issue,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Issue')),
              ),
              if (_tickets.isEmpty)
                _Empty('No tickets issued yet.')
              else
                for (final t in _tickets)
                  Builder(builder: (context) {
                    final td = Map<String, dynamic>.from(t['data'] ?? t);
                    final status = (td['status'] ?? '').toString();
                    return ListTile(
                      dense: true,
                      leading: Icon(
                        status == 'checked_in'
                            ? Icons.check_circle
                            : Icons.radio_button_unchecked,
                        color: status == 'checked_in'
                            ? theme.colorScheme.primary
                            : theme.colorScheme.outline,
                      ),
                      title: Text((td['holderName'] ?? td['holderEmail'] ?? 'Ticket').toString()),
                      subtitle: SelectableText((td['code'] ?? '').toString(),
                          style: theme.textTheme.bodySmall),
                      trailing: Text(status,
                          style: theme.textTheme.labelSmall
                              ?.copyWith(color: theme.colorScheme.outline)),
                    );
                  }),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.action});
  final String title;
  final Widget action;
  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(
            child: Text(title, style: Theme.of(context).textTheme.titleMedium)),
        action,
      ]);
}

class _Empty extends StatelessWidget {
  const _Empty(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text(text,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: Theme.of(context).colorScheme.outline)),
      );
}
