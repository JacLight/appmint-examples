import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../events_api.dart';
import '../main.dart';

/// The door. Type or paste a ticket code, and the server decides.
///
/// A phone camera reads the same code off a QR — this example takes it typed
/// so it runs anywhere, including a browser, and so the interesting part is
/// visible: what comes back, and what each answer means.
class DoorPage extends StatefulWidget {
  const DoorPage({
    super.key,
    required this.state,
    required this.eventId,
    required this.title,
  });

  final DemoState state;
  final String eventId;
  final String title;

  @override
  State<DoorPage> createState() => _DoorPageState();
}

class _DoorPageState extends State<DoorPage> {
  final _code = TextEditingController();
  final _zone = TextEditingController();
  bool _checkingIn = true;
  bool _busy = false;
  ScanResult? _last;
  Map<String, dynamic>? _stats;
  // The check-in answer names the ticket type by id. Load the event's types
  // once so the card can say "General Admission" instead of a hex string.
  Map<String, String> _typeTitles = const {};

  @override
  void initState() {
    super.initState();
    _refreshStats();
    _loadTypes();
  }

  Future<void> _loadTypes() async {
    try {
      final types = await widget.state.api.listTicketTypes(widget.eventId);
      if (!mounted) return;
      setState(() => _typeTitles = {
            for (final t in types)
              (t['sk'] ?? '').toString():
                  (t['data']?['title'] ?? t['data']?['name'] ?? '').toString(),
          });
    } on AppmintException {
      // the id still shows; the scan is unaffected
    }
  }

  @override
  void dispose() {
    _code.dispose();
    _zone.dispose();
    super.dispose();
  }

  Future<void> _refreshStats() async {
    try {
      final s = await widget.state.api.stats(widget.eventId);
      if (mounted) setState(() => _stats = s);
    } on AppmintException {
      // stats are decoration here; the scan result is what matters
    }
  }

  Future<void> _scan() async {
    final code = _code.text.trim();
    if (code.isEmpty) return;
    setState(() {
      _busy = true;
      _last = null;
    });
    try {
      final zone = _zone.text.trim();
      final result = _checkingIn
          ? await widget.state.api.checkIn(code, zone: zone)
          : await widget.state.api.checkOut(code, zone: zone);
      if (mounted) {
        setState(() => _last = result.withTicketType(
            _typeTitles[result.ticketType] ?? result.ticketType));
      }
      _code.clear();
      await _refreshStats();
    } on AppmintException catch (e) {
      if (mounted) {
        setState(() => _last = ScanResult(
            outcome: ScanOutcome.denied, message: e.message));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = _stats;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(12, 16, 28, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.pop(context)),
            Expanded(
                child: Text('Door · ${widget.title}',
                    style: theme.textTheme.headlineSmall)),
          ]),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Check in and check out are the same scanner in a different
                // mode. That is what makes occupancy a live count per zone
                // rather than a total of everyone who ever came through.
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(
                        value: true,
                        label: Text('Check in'),
                        icon: Icon(Icons.login, size: 16)),
                    ButtonSegment(
                        value: false,
                        label: Text('Check out'),
                        icon: Icon(Icons.logout, size: 16)),
                  ],
                  selected: {_checkingIn},
                  onSelectionChanged: (v) =>
                      setState(() => _checkingIn = v.first),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _zone,
                  decoration: const InputDecoration(
                    labelText: 'Zone (optional)',
                    helperText:
                        'A scan with no zone still admits the person but counts toward no zone’s occupancy.',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _code,
                  onSubmitted: (_) => _busy ? null : _scan(),
                  decoration: InputDecoration(
                    labelText: 'Ticket code',
                    helperText: 'Paste the code from an issued ticket.',
                    suffixIcon: IconButton(
                      tooltip: _checkingIn ? 'Check in' : 'Check out',
                      icon: const Icon(Icons.send),
                      onPressed: _busy ? null : _scan,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                if (_last != null) _ResultCard(result: _last!),
                const SizedBox(height: 24),
                Text('Live', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                if (s == null)
                  Text('—', style: theme.textTheme.bodySmall)
                else
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      _Stat('Scans', s['total']),
                      _Stat('Admitted', s['successful']),
                      _Stat('Denied', s['denied']),
                      _Stat('People', s['uniqueAttendees']),
                    ],
                  ),
                const SizedBox(height: 4),
                Text(
                  'Stats are read after every scan. People counts distinct ticket holders, so a re-scan does not inflate it.',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.outline),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Three answers, three colours. The amber one is the one staff misread: it
/// is not a fake ticket, it is somebody who was already let in.
class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.result});

  final ScanResult result;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (colour, label, icon) = switch (result.outcome) {
      ScanOutcome.admitted => (
          const Color(0xFF1E6FD9),
          result.message.toUpperCase(),
          Icons.check_circle
        ),
      ScanOutcome.alreadyUsed => (
          const Color(0xFFD98C1E),
          'ALREADY CHECKED IN',
          Icons.history
        ),
      ScanOutcome.denied => (
          theme.colorScheme.error,
          'DENIED',
          Icons.block
        ),
    };

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colour.withValues(alpha: 0.08),
        border: Border.all(color: colour.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: colour, size: 32),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: theme.textTheme.titleMedium
                        ?.copyWith(color: colour, fontWeight: FontWeight.w800)),
                if (result.holder != null)
                  Text(result.holder!, style: theme.textTheme.bodyMedium),
                if (result.ticketType != null)
                  Text(result.ticketType!, style: theme.textTheme.bodySmall),
                if (result.outcome != ScanOutcome.admitted)
                  Text(result.message,
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
          Text('${value ?? 0}', style: theme.textTheme.titleLarge),
          Text(label,
              style: theme.textTheme.labelSmall
                  ?.copyWith(color: theme.colorScheme.outline)),
        ],
      ),
    );
  }
}
