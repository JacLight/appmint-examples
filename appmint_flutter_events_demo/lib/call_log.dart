import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

/// Every call the client made, newest first.
///
/// This is the point of the demo. The confusing part of appengine is not any
/// single endpoint, it is that two different tokens ride on a request and
/// answer two different questions. Watching the badges flip as you sign in
/// explains that faster than any paragraph.
class CallLog extends ChangeNotifier {
  final List<AppmintCall> _calls = [];

  List<AppmintCall> get calls => List.unmodifiable(_calls);

  void add(AppmintCall call) {
    _calls.insert(0, call);
    if (_calls.length > 80) _calls.removeLast();
    notifyListeners();
  }

  void clear() {
    _calls.clear();
    notifyListeners();
  }
}

class CallLogPanel extends StatelessWidget {
  const CallLogPanel({super.key, required this.log});

  final CallLog log;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AnimatedBuilder(
      animation: log,
      builder: (context, _) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 4),
              child: Row(
                children: [
                  Text('Requests', style: theme.textTheme.titleSmall),
                  const SizedBox(width: 8),
                  Text(
                    '${log.calls.length}',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.colorScheme.outline),
                  ),
                  const Spacer(),
                  if (log.calls.isNotEmpty)
                    TextButton(onPressed: log.clear, child: const Text('Clear')),
                ],
              ),
            ),
            if (log.calls.isEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                child: Text(
                  'Nothing yet. Every call this app makes will appear here, '
                  'with which tokens went with it.',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.outline),
                ),
              )
            else
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.only(bottom: 12),
                  itemCount: log.calls.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (context, i) => _CallRow(call: log.calls[i]),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _CallRow extends StatelessWidget {
  const _CallRow({required this.call});

  final AppmintCall call;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colour = call.ok ? theme.colorScheme.primary : theme.colorScheme.error;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 34,
            child: Text(
              '${call.status}',
              style: theme.textTheme.labelMedium
                  ?.copyWith(color: colour, fontWeight: FontWeight.w700),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${call.method}  ${call.path}',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 6,
                  children: [
                    _Chip(
                      label: 'app token',
                      on: call.appAuthenticated,
                      tooltip: 'Authorization: Bearer — proves the app may '
                          'talk to appengine at all',
                    ),
                    _Chip(
                      label: 'user token',
                      on: call.sentUserToken,
                      tooltip: 'x-client-authorization — proves who is doing '
                          'this. Absent until somebody signs in.',
                    ),
                    _Chip(label: '${call.took.inMilliseconds}ms', on: false),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.on, this.tooltip});

  final String label;
  final bool on;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final chip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: on
            ? theme.colorScheme.primaryContainer
            : theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: on
              ? theme.colorScheme.onPrimaryContainer
              : theme.colorScheme.outline,
        ),
      ),
    );
    return tooltip == null ? chip : Tooltip(message: tooltip!, child: chip);
  }
}
