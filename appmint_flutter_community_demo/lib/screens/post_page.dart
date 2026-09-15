import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../community_api.dart';
import '../main.dart';
import 'post_widgets.dart';

/// One post and its comment thread.
class PostPage extends StatefulWidget {
  const PostPage({super.key, required this.state, required this.postId});

  final DemoState state;
  final String postId;

  @override
  State<PostPage> createState() => _PostPageState();
}

class _PostPageState extends State<PostPage> {
  final _reply = TextEditingController();
  Map<String, dynamic>? _post;
  List<Map<String, dynamic>> _comments = const [];
  bool _sending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final post = await widget.state.api.getPost(widget.postId);
      final comments = await widget.state.api.comments(widget.postId);
      if (mounted) {
        setState(() {
          _post = post;
          _comments = comments;
          _error = null;
        });
      }
    } on AppmintException catch (e) {
      // "Post not found" is also what a removed post says. Moderation is
      // immediate here: hidden means gone, for everyone, at once.
      if (mounted) setState(() => _error = e.message);
    }
  }

  Future<void> _send() async {
    final text = _reply.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await widget.state.api.addComment(widget.postId, text);
      _reply.clear();
      await _load();
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final post = _post;
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
              Expanded(child: Text('Post', style: theme.textTheme.headlineSmall)),
            ],
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 4, 28, 0),
            child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
          ),
        Expanded(
          child: post == null
              ? (_error == null
                  ? const Center(child: CircularProgressIndicator())
                  : const SizedBox.shrink())
              : ListView(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 120),
                  children: [
                    PostCard(
                      state: widget.state,
                      post: post,
                      onChanged: (p) => setState(() => _post = p),
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Text('Comments (${_comments.length})',
                          style: theme.textTheme.titleMedium),
                    ),
                    const SizedBox(height: 4),
                    if (_comments.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                        child: Text('No comments yet.',
                            style: theme.textTheme.bodySmall
                                ?.copyWith(color: theme.colorScheme.outline)),
                      )
                    else
                      for (final c in _comments) _CommentTile(state: widget.state, comment: c),
                    const SizedBox(height: 12),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _reply,
                            minLines: 1,
                            maxLines: 4,
                            enabled: !_sending,
                            onSubmitted: (_) => _sending ? null : _send(),
                            decoration: const InputDecoration(hintText: 'Write a comment'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        FilledButton(
                          onPressed: _sending ? null : _send,
                          child: Text(_sending ? 'Sending…' : 'Reply'),
                        ),
                      ],
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}

/// A comment, with its own like. Same rules as a post: plain text, and the
/// heart waits for the server.
class _CommentTile extends StatefulWidget {
  const _CommentTile({required this.state, required this.comment});

  final DemoState state;
  final Map<String, dynamic> comment;

  @override
  State<_CommentTile> createState() => _CommentTileState();
}

class _CommentTileState extends State<_CommentTile> {
  bool _reacting = false;
  int? _delta;
  bool? _liked;

  Future<void> _like() async {
    setState(() => _reacting = true);
    try {
      final r = await widget.state.api.react(
          target: widget.comment.id, targetType: 'comment');
      setState(() {
        _liked = r.nowReacted;
        _delta = (_delta ?? 0) + (r.nowReacted ? 1 : -1);
      });
    } on AppmintException {
      // shown nowhere: the count did not move, because nothing happened
    } finally {
      if (mounted) setState(() => _reacting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = widget.comment;
    final count = (c.reactions + (_delta ?? 0)).clamp(0, 1 << 30);
    final liked = _liked ?? c.viewerLiked;
    return ListTile(
      leading: CircleAvatar(
        radius: 14,
        backgroundImage: c.authorImage != null ? NetworkImage(c.authorImage!) : null,
        child: c.authorImage == null
            ? Text(c.authorName.isEmpty ? '?' : c.authorName[0].toUpperCase(),
                style: const TextStyle(fontSize: 12))
            : null,
      ),
      title: Text(c.authorName, style: theme.textTheme.labelLarge),
      subtitle: SelectableText('${c.d['content'] ?? ''}'),
      trailing: TextButton.icon(
        onPressed: _reacting ? null : _like,
        icon: Icon(liked ? Icons.favorite : Icons.favorite_border,
            size: 16, color: liked ? theme.colorScheme.error : null),
        label: Text('$count'),
      ),
    );
  }
}
