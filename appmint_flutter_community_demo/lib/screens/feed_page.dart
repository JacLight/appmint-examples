import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../community_api.dart';
import '../main.dart';
import 'post_page.dart';
import 'post_widgets.dart';

/// The feed: what people posted, newest or most-reacted first, and a box to
/// post something yourself.
class FeedPage extends StatefulWidget {
  const FeedPage({super.key, required this.state});

  final DemoState state;

  @override
  State<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends State<FeedPage> {
  final _compose = TextEditingController();
  List<Map<String, dynamic>> _posts = const [];
  String _sort = 'latest';
  String? _hashtag;
  bool _loading = true;
  bool _posting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _compose.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await widget.state.api.feed(sort: _sort, hashtag: _hashtag);
      if (mounted) setState(() => _posts = rows);
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _post() async {
    final text = _compose.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _posting = true;
      _error = null;
    });
    try {
      await widget.state.api.createPost(text);
      _compose.clear();
      await _load();
    } on AppmintException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  /// A post changed under us (reaction, comment) — replace just that row.
  void _replace(Map<String, dynamic> post) {
    final i = _posts.indexWhere((p) => p.id == post.id);
    if (i >= 0) setState(() => _posts[i] = post);
  }

  Future<void> _open(Map<String, dynamic> post) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DemoScaffold(
          state: widget.state,
          child: PostPage(state: widget.state, postId: post.id),
        ),
      ),
    );
    _load(); // counts may have moved
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = widget.state.user!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 16, 20, 4),
          child: Row(
            children: [
              Expanded(child: Text('Community', style: theme.textTheme.headlineSmall)),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'latest', label: Text('Latest')),
                  ButtonSegment(value: 'trending', label: Text('Trending')),
                ],
                selected: {_sort},
                onSelectionChanged: (s) {
                  setState(() => _sort = s.first);
                  _load();
                },
              ),
              const SizedBox(width: 12),
              Text(user.email,
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
              IconButton(
                tooltip: 'Sign out',
                icon: const Icon(Icons.logout),
                onPressed: widget.state.appmint.auth.signOut,
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(28, 8, 28, 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: _compose,
                  minLines: 1,
                  maxLines: 4,
                  enabled: !_posting,
                  decoration: const InputDecoration(
                    hintText: 'Say something. #hashtags and @mentions are picked up by the server.',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _posting ? null : _post,
                child: Text(_posting ? 'Posting…' : 'Post'),
              ),
            ],
          ),
        ),
        if (_hashtag != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 4, 28, 0),
            child: Row(children: [
              InputChip(
                label: Text('#$_hashtag'),
                onDeleted: () {
                  setState(() => _hashtag = null);
                  _load();
                },
              ),
            ]),
          ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(28, 4, 28, 0),
            child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
          ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _posts.isEmpty
                  ? Center(
                      child: Text('Nothing here yet. Be first.',
                          style: theme.textTheme.bodyMedium
                              ?.copyWith(color: theme.colorScheme.outline)),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
                      itemCount: _posts.length,
                      itemBuilder: (context, i) => PostCard(
                        state: widget.state,
                        post: _posts[i],
                        onChanged: _replace,
                        onOpen: () => _open(_posts[i]),
                        onHashtag: (h) {
                          setState(() => _hashtag = h);
                          _load();
                        },
                      ),
                    ),
        ),
      ],
    );
  }
}
