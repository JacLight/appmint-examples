import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter/material.dart';

import '../community_api.dart';
import '../main.dart';

/// One post. Everything on it was written by somebody else, which shapes
/// three decisions here:
///
///  * the text is drawn as plain text — never markdown, never HTML — so a
///    post cannot style itself, embed things, or hide a link behind words;
///  * images are loaded at a fixed size from the server's medium thumbnail,
///    so a 4 MB original cannot stall the feed;
///  * the like button waits for the server and shows what it answered.
class PostCard extends StatefulWidget {
  const PostCard({
    super.key,
    required this.state,
    required this.post,
    required this.onChanged,
    this.onOpen,
    this.onHashtag,
  });

  final DemoState state;
  final Map<String, dynamic> post;
  final void Function(Map<String, dynamic> post) onChanged;
  final VoidCallback? onOpen;
  final void Function(String hashtag)? onHashtag;

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  bool _reacting = false;
  String? _flash;

  /// Send the reaction, then believe the answer. The count is nudged by
  /// exactly what the server said happened, not by what we hoped.
  Future<void> _like() async {
    setState(() {
      _reacting = true;
      _flash = null;
    });
    try {
      final r = await widget.state.api.react(target: widget.post.id, targetType: 'post');
      final d = Map<String, dynamic>.from(widget.post.d);
      final stats = Map<String, dynamic>.from(d['stats'] ?? {});
      stats['reactions'] = (widget.post.reactions + (r.nowReacted ? 1 : -1)).clamp(0, 1 << 30);
      d['stats'] = stats;
      d['viewerLiked'] = r.nowReacted;
      widget.onChanged({...widget.post, 'data': d});
    } on AppmintException catch (e) {
      // Nothing changed on screen, because nothing changed on the server.
      setState(() => _flash = e.message);
    } finally {
      if (mounted) setState(() => _reacting = false);
    }
  }

  Future<void> _report() async {
    final result = await showDialog<String>(
      context: context,
      builder: (_) => _ReportDialog(state: widget.state, post: widget.post),
    );
    if (result != null && mounted) setState(() => _flash = result);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final p = widget.post;
    final me = widget.state.user!.email;
    final when = p.created?.toLocal();
    final stamp = when == null
        ? ''
        : '${when.year}-${when.month.toString().padLeft(2, '0')}-${when.day.toString().padLeft(2, '0')} '
            '${when.hour.toString().padLeft(2, '0')}:${when.minute.toString().padLeft(2, '0')}';

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundImage:
                      p.authorImage != null ? NetworkImage(p.authorImage!) : null,
                  child: p.authorImage == null
                      ? Text(p.authorName.isEmpty ? '?' : p.authorName[0].toUpperCase())
                      : null,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.authorName, style: theme.textTheme.titleSmall),
                      Text(stamp,
                          style: theme.textTheme.labelSmall
                              ?.copyWith(color: theme.colorScheme.outline)),
                    ],
                  ),
                ),
                if (p.authorEmail != me)
                  PopupMenuButton<String>(
                    tooltip: 'More',
                    onSelected: (v) {
                      if (v == 'report') _report();
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(value: 'report', child: Text('Report this author')),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: 10),
            // Plain text on purpose. See the class comment.
            SelectableText('${p.d['content'] ?? ''}', style: theme.textTheme.bodyMedium),
            if (p.images.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final url in p.images)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        url,
                        width: 220,
                        height: 160,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          width: 220,
                          height: 160,
                          color: theme.colorScheme.surfaceContainerHighest,
                          alignment: Alignment.center,
                          child: const Icon(Icons.broken_image_outlined),
                        ),
                      ),
                    ),
                ],
              ),
            ],
            if (p.hashtags.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                children: [
                  for (final h in p.hashtags)
                    ActionChip(
                      label: Text('#$h'),
                      visualDensity: VisualDensity.compact,
                      onPressed: widget.onHashtag == null ? null : () => widget.onHashtag!(h),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 6),
            Row(
              children: [
                TextButton.icon(
                  onPressed: _reacting ? null : _like,
                  icon: Icon(
                    p.viewerLiked ? Icons.favorite : Icons.favorite_border,
                    size: 18,
                    color: p.viewerLiked ? theme.colorScheme.error : null,
                  ),
                  label: Text('${p.reactions}'),
                ),
                TextButton.icon(
                  onPressed: widget.onOpen,
                  icon: const Icon(Icons.mode_comment_outlined, size: 18),
                  label: Text('${p.commentCount}'),
                ),
                if (_flash != null)
                  Expanded(
                    child: Text(_flash!,
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.colorScheme.error)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Report the author of a post. Moderation is not an advanced feature in a
/// community; it is the first week. The reasons are the five the server
/// accepts, and its refusals ("Report already pending") are shown verbatim.
class _ReportDialog extends StatefulWidget {
  const _ReportDialog({required this.state, required this.post});

  final DemoState state;
  final Map<String, dynamic> post;

  @override
  State<_ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<_ReportDialog> {
  final _details = TextEditingController();
  String _reason = 'spam';
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _details.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.state.api.reportAuthor(
        authorEmail: widget.post.authorEmail,
        reason: _reason,
        details: _details.text.trim(),
        postId: widget.post.id,
      );
      if (mounted) Navigator.pop(context, 'Reported. A moderator will review it.');
    } on AppmintException catch (e) {
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
    return AlertDialog(
      title: Text('Report ${widget.post.authorName}'),
      content: SizedBox(
        width: 380,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DropdownButtonFormField<String>(
              initialValue: _reason,
              decoration: const InputDecoration(labelText: 'Reason'),
              items: [
                for (final r in CommunityApi.reportReasons)
                  DropdownMenuItem(value: r, child: Text(r.replaceAll('_', ' '))),
              ],
              onChanged: (v) => setState(() => _reason = v ?? _reason),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _details,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'What happened?'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
            onPressed: _busy ? null : () => Navigator.pop(context),
            child: const Text('Cancel')),
        FilledButton(
            onPressed: _busy ? null : _send,
            child: Text(_busy ? 'Sending…' : 'Report')),
      ],
    );
  }
}
