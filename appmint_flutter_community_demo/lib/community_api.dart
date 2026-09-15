import 'package:appmint_flutter_client/appmint_flutter_client.dart';

/// The community endpoints this app uses, and the things about them that
/// are not obvious from their names.
///
/// Everything lives under `/client/community` and is written by signed-in
/// customers — the token on the request is the author. Thin on purpose: one
/// request per method, plain maps, and the comments are the part worth
/// reading. Every claim was checked against the real server.
class CommunityApi {
  CommunityApi(this._appmint);

  final Appmint _appmint;
  AppmintHttp get _http => _appmint.http;

  // ── the feed ──────────────────────────────────────────────────────────

  /// Posts, newest first — or by reaction count with `sort: 'trending'`.
  /// Removed posts are already filtered out. Because the request carries the
  /// viewer's token, each post comes back with `viewerLiked` and
  /// `viewerSaved` set for *this* person, so a like button can start in the
  /// right state without a second request.
  Future<List<Map<String, dynamic>>> feed({
    String sort = 'latest',
    String? hashtag,
    int limit = 20,
  }) async {
    final res = await _http.get('/client/community/feed', query: {
      'sort': sort,
      'limit': '$limit',
      if (hashtag != null && hashtag.isNotEmpty) 'hashtag': hashtag,
    });
    return _rows(res);
  }

  /// A post is `content` and not much else. The server pulls `#hashtags` and
  /// `@mentions` out of the text, stamps the author from the token, and
  /// starts the counters at zero. `visibility` defaults to `public` unless
  /// the post belongs to a page.
  Future<Map<String, dynamic>> createPost(String content) async =>
      _map(await _http.post('/client/community/posts', body: {'content': content}));

  Future<Map<String, dynamic>> getPost(String id) async =>
      _map(await _http.get('/client/community/posts/$id'));

  Future<void> deletePost(String id) async {
    await _http.delete('/client/community/posts/$id');
  }

  // ── comments ──────────────────────────────────────────────────────────

  /// Top-level comments, oldest first. Replies to a comment are fetched with
  /// `parentComment` and are not included here.
  Future<List<Map<String, dynamic>>> comments(String postId) async =>
      _rows(await _http.get('/client/community/posts/$postId/comments',
          query: {'limit': '100'}));

  Future<Map<String, dynamic>> addComment(String postId, String content) async =>
      _map(await _http.post('/client/community/posts/$postId/comments',
          body: {'content': content}));

  // ── reactions ─────────────────────────────────────────────────────────

  /// One call, three outcomes, and the server decides which:
  ///
  ///   { action: 'added',   type }          — you had no reaction; now you do
  ///   { action: 'removed', type }          — same type again: toggled off
  ///   { action: 'changed', from, to }      — a different type: swapped
  ///
  /// So the honest UI is: send, wait, then apply what came back. Flipping the
  /// heart first and hoping is how a person ends up believing they liked
  /// something they did not.
  Future<ReactionResult> react({
    required String target,
    required String targetType,
    String type = 'like',
  }) async {
    final res = _map(await _http.post('/client/community/react', body: {
      'target': target,
      'targetType': targetType,
      'type': type,
    }));
    return ReactionResult(
      action: '${res['action'] ?? ''}',
      type: '${res['type'] ?? res['to'] ?? type}',
    );
  }

  // ── moderation ────────────────────────────────────────────────────────

  /// Reports are about *people*, not posts: the body names the author
  /// (`reportedId` is their email), the reason is one of five words the
  /// server accepts, and the post goes in `context` so a moderator can find
  /// it. A second pending report on the same person from you is refused —
  /// "Report already pending" — which the app shows as-is.
  Future<Map<String, dynamic>> reportAuthor({
    required String authorEmail,
    required String reason,
    required String details,
    String? postId,
  }) async =>
      _map(await _http.post('/client/community/reports', body: {
        'reportedId': authorEmail,
        'reason': reason,
        'details': details,
        'context': {'source': 'post', 'messageId': ?postId},
      }));

  static const reportReasons = [
    'spam', 'harassment', 'inappropriate', 'unwanted_contact', 'other',
  ];

  // ── helpers ───────────────────────────────────────────────────────────

  static Map<String, dynamic> _map(dynamic res) =>
      res is Map ? Map<String, dynamic>.from(res) : <String, dynamic>{};

  static List<Map<String, dynamic>> _rows(dynamic res) {
    final raw = res is Map ? (res['data'] ?? res['items']) : res;
    return raw is List
        ? raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
        : const [];
  }
}

class ReactionResult {
  const ReactionResult({required this.action, required this.type});
  final String action; // added | removed | changed
  final String type;
  bool get nowReacted => action != 'removed';
}

/// Display helpers for post and comment records.
extension PostView on Map<String, dynamic> {
  Map<String, dynamic> get d =>
      this['data'] is Map ? Map<String, dynamic>.from(this['data']) : this;
  String get id => (this['sk'] ?? '').toString();
  String get authorEmail => (d['author'] ?? '').toString();

  String get authorName {
    final info = d['authorInfo'] is Map ? Map<String, dynamic>.from(d['authorInfo']) : const {};
    final name = [info['firstName'], info['lastName']]
        .where((s) => s != null && '$s'.trim().isNotEmpty)
        .join(' ')
        .trim();
    return name.isEmpty ? authorEmail : name;
  }

  /// The avatar, if the author has one. `authorInfo.image` is a file object;
  /// its `url` is a signed link that expires, which is why it is read fresh
  /// off every post rather than cached.
  String? get authorImage {
    final info = d['authorInfo'];
    final img = info is Map ? info['image'] : null;
    return img is Map ? img['url']?.toString() : null;
  }

  /// Image URLs for a post, medium size. Every media entry is a file object
  /// with signed `xs`/`sm`/`md` thumbnails and a full `url`; the medium one
  /// is what a feed should load — the originals here are 4 MB each.
  List<String> get images => [
        for (final m in (d['media'] as List? ?? const []))
          if (m is Map && (m['md'] ?? m['url']) != null) '${m['md'] ?? m['url']}',
      ];

  int get reactions => (d['stats']?['reactions'] as num?)?.toInt() ?? 0;
  int get commentCount => (d['stats']?['comments'] as num?)?.toInt() ?? 0;
  bool get viewerLiked => d['viewerLiked'] == true;
  List<String> get hashtags =>
      [for (final h in (d['hashtags'] as List? ?? const [])) '$h'];
  DateTime? get created => DateTime.tryParse('${this['createdate'] ?? ''}');
}
