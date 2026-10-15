import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:appmint_flutter_client/appmint_flutter_client.dart';
/// Ordinary customer Bearer transport. Retains official AppmintAuth, challenge
/// results, refresh callbacks and SessionStore; no app-key/System bootstrap.
class CustomerTransport extends AppmintHttp {
  CustomerTransport({required String base, required String organization})
      : super(AppmintConfig(baseUrl: base, orgId: organization,
          appId: '', appKey: '', appSecret: '', transientRetries: 1));
  final calls = <Map<String, dynamic>>[];
  @override
  Future<dynamic> send(String method, String path, {Object? body,
      Map<String, String>? query, bool sendUserToken = true,
      bool retriedAfterRenew = false}) async {
    final uri = Uri.parse('${config.baseUrl}$path').replace(queryParameters: query);
    final req = http.Request(method, uri)..headers.addAll({
      'Content-Type': 'application/json', 'orgid': config.orgId,
      if(sendUserToken && hasUserToken) 'Authorization': 'Bearer $userToken',
    });
    if(body != null) req.body=jsonEncode(body);
    http.Response response;
    try { response=await http.Response.fromStream(await req.send().timeout(config.timeout)); }
    catch (_) { throw const AppmintNetworkException('Connection interrupted. Check your bookings before trying another booking.'); }
    calls.add({'method':method,'path':path,'status':response.statusCode});
    dynamic value; try { value=response.body.isEmpty?null:jsonDecode(response.body); } catch(_){ value=response.body; }
    if(response.statusCode==401 && sendUserToken && hasUserToken && !retriedAfterRenew){
      final renewed=await onUserTokenRefresh?.call();
      if(renewed!=null && renewed.isNotEmpty){setUserToken(renewed);return send(method,path,body:body,query:query,sendUserToken:sendUserToken,retriedAfterRenew:true);}
      clearUserToken();onSessionExpired?.call();throw const AppmintSessionExpiredException();
    }
    if(response.statusCode>=400){final map=value is Map?value:{};
      throw AppmintException('${map['message']??map['error']??'Request refused'}',statusCode:response.statusCode,reason:map['reason']?.toString(),body:response.body);}
    return value;
  }
}
