import 'package:flutter/material.dart';

/// One line per thing that happened on the socket — a state change, an event
/// in, an event out. Never the token.
class SocketLine {
  const SocketLine({
    required this.direction,
    required this.name,
    this.detail,
    required this.at,
  });

  /// `state` for connection changes, `in` for events from the gateway,
  /// `out` for events this app emitted.
  final String direction;
  final String name;
  final String? detail;
  final DateTime at;
}

class SocketLog extends ChangeNotifier {
  final List<SocketLine> _lines = [];
  List<SocketLine> get lines => List.unmodifiable(_lines);

  void add(String direction, String name, [String? detail]) {
    _lines.insert(
        0,
        SocketLine(
            direction: direction, name: name, detail: detail, at: DateTime.now()));
    if (_lines.length > 120) _lines.removeLast();
    notifyListeners();
  }

  void state(String s) => add('state', s);
  void incoming(String event, [String? detail]) => add('in', event, detail);
  void outgoing(String event, [String? detail]) => add('out', event, detail);

  void clear() {
    _lines.clear();
    notifyListeners();
  }
}

/// The socket, line by line. Everything else in these examples is a request
/// and a response you can see in the other panel; this is the part that
/// would otherwise happen in silence.
class SocketLogPanel extends StatelessWidget {
  const SocketLogPanel({super.key, required this.log});

  final SocketLog log;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedBuilder(
      animation: log,
      builder: (context, _) {
        final lines = log.lines;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text('Socket  ${lines.length}',
                        style: theme.textTheme.titleSmall),
                  ),
                  TextButton(onPressed: log.clear, child: const Text('Clear')),
                ],
              ),
            ),
            Expanded(
              child: lines.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'Nothing yet. The socket connects when the support '
                        'screen opens.',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.colorScheme.outline),
                      ),
                    )
                  : ListView.builder(
                      itemCount: lines.length,
                      itemBuilder: (context, i) => _Line(line: lines[i]),
                    ),
            ),
          ],
        );
      },
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({required this.line});

  final SocketLine line;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (glyph, colour) = switch (line.direction) {
      'in' => ('←', const Color(0xFF1E6FD9)),
      'out' => ('→', const Color(0xFF0B7A75)),
      _ => ('•', theme.colorScheme.outline),
    };
    final t = line.at;
    final stamp = '${t.hour.toString().padLeft(2, '0')}:'
        '${t.minute.toString().padLeft(2, '0')}:'
        '${t.second.toString().padLeft(2, '0')}';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 18,
            child: Text(glyph,
                style: TextStyle(color: colour, fontWeight: FontWeight.w800)),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(line.name,
                    style: theme.textTheme.bodySmall?.copyWith(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w600,
                        color: colour)),
                if (line.detail != null && line.detail!.isNotEmpty)
                  Text(line.detail!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.colorScheme.outline)),
              ],
            ),
          ),
          Text(stamp,
              style: theme.textTheme.labelSmall
                  ?.copyWith(color: theme.colorScheme.outline)),
        ],
      ),
    );
  }
}
