import 'dart:async';

import 'package:appmint_flutter_chat/appmint_flutter_chat.dart';
import 'package:flutter/material.dart';

import '../main.dart';

/// The customer's support conversation.
///
/// The chat package does the work — `AppmintChatController` owns the socket
/// and `AppmintChatView` draws the thread. This page is the wiring an app has
/// to do: hand the package the signed-in person's token, show the connection
/// state somewhere honest, and (for this example) narrate the socket.
class SupportPage extends StatefulWidget {
  const SupportPage({super.key, required this.state});

  final DemoState state;

  @override
  State<SupportPage> createState() => _SupportPageState();
}

class _SupportPageState extends State<SupportPage> {
  late final AppmintChatController _chat;
  final _subs = <StreamSubscription>[];

  @override
  void initState() {
    super.initState();
    final appmint = widget.state.appmint;
    final user = widget.state.user!;

    // Everything the package needs, taken from the client rather than typed
    // again. `token` is the one place the person's token leaves the client:
    // a WebSocket has no headers, so the gateway reads it from the handshake.
    _chat = AppmintChatController(AppmintChatConfig(
      endpoint: appmint.config.baseUrl,
      orgId: appmint.config.orgId,
      user: AppmintChatUser(email: user.email, name: user.displayName),
      token: () async => appmint.http.userToken,
      supportName: 'Support',
      welcome: 'Say hello. Somebody on the team will pick this up.',
    ));

    _narrate();
    _chat.start();
  }

  /// Mirror the socket into the panel on the right. Nothing here changes
  /// behaviour; the controller already reacts to all of it.
  void _narrate() {
    final log = widget.state.socketLog;
    final s = _chat.service;
    log.outgoing('connect', '${_chat.config.endpoint}/chat · token in handshake');
    _subs.add(s.onConnection.listen((c) => log.state(c.name)));
    _subs.add(s.onAuth.listen((a) => log.incoming(
        'authenticate',
        a.success
            ? 'role=${a.role ?? '?'} email=${a.email ?? '?'}'
            : 'refused: ${a.error}')));
    _subs.add(s.onMessage.listen((m) => log.incoming(
        'message', '${m.from} → ${m.to}: ${_clip(m.content)}')));
    _subs.add(s.onQueue.listen((q) =>
        log.incoming('queued', 'position ${q.position}, ${q.ahead} ahead')));
    _subs.add(s.onAgent.listen(
        (a) => log.incoming('agent-assigned', '${a.name} <${a.email}>')));
    _subs.add(s.onStatus.listen(
        (x) => log.incoming('status', '${x['from']}: ${x['status'] ?? x['type']}')));
    _subs.add(s.onUpdate.listen(
        (u) => log.incoming('update', '${u['uid']} → ${u['status']}')));
    _subs.add(s.onEnded.listen((e) => log.incoming('chat-ended', '${e['reason']}')));
    _subs.add(s.onNotice.listen((n) => log.incoming('notice', n)));
    _subs.add(s.onError.listen((e) => log.incoming('error', e)));
    // Sends go out through the controller; log them as the person types.
    _chat.addListener(_onChat);
  }

  int _seenMine = 0;
  void _onChat() {
    final mine = _chat.messages.where((m) => m.senderRole == 'customer').length;
    if (mine > _seenMine) {
      final last =
          _chat.messages.lastWhere((m) => m.senderRole == 'customer');
      widget.state.socketLog.outgoing('chat-message', _clip(last.content));
    }
    _seenMine = mine;
  }

  static String _clip(String s) => s.length > 80 ? '${s.substring(0, 80)}…' : s;

  @override
  void dispose() {
    for (final s in _subs) {
      s.cancel();
    }
    _chat.removeListener(_onChat);
    _chat.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = widget.state.user!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 20, 20, 8),
          child: Row(
            children: [
              Expanded(
                child: ListenableBuilder(
                  listenable: _chat,
                  builder: (context, _) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_chat.counterpartName,
                          style: theme.textTheme.headlineSmall),
                      _ConnectionLine(chat: _chat),
                    ],
                  ),
                ),
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
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            child: AppmintChatView(
              controller: _chat,
              theme: AppmintChatTheme(
                accent: theme.colorScheme.primary,
                background: theme.colorScheme.surface,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// The connection state, where the person can see it. When the socket is
/// down, sending does nothing and says nothing — so this line has to.
class _ConnectionLine extends StatelessWidget {
  const _ConnectionLine({required this.chat});

  final AppmintChatController chat;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (text, colour) = switch (chat.connection) {
      AppmintChatConnection.authenticated => chat.peerTyping
          ? ('typing…', theme.colorScheme.primary)
          : chat.agent != null
              ? ('${chat.agent!.email} is on this chat', theme.colorScheme.primary)
              : chat.queue != null
                  ? ('In the queue — position ${chat.queue!.position}', const Color(0xFFD98C1E))
                  : ('Connected', theme.colorScheme.primary),
      AppmintChatConnection.connecting ||
      AppmintChatConnection.connected =>
        ('Connecting…', theme.colorScheme.outline),
      AppmintChatConnection.disconnected =>
        ('Disconnected — reconnecting', theme.colorScheme.error),
      AppmintChatConnection.failed =>
        (chat.error ?? 'Not connected', theme.colorScheme.error),
    };
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          margin: const EdgeInsets.only(right: 6),
          decoration: BoxDecoration(color: colour, shape: BoxShape.circle),
        ),
        Text(text, style: theme.textTheme.bodySmall?.copyWith(color: colour)),
      ],
    );
  }
}
