import 'dart:convert';
import 'package:http/http.dart' as http;
class ActorSession {
 final String origin, orgId, token;
 const ActorSession(this.origin, this.orgId, this.token);
}
class LogisticsClient {
 final Map<String, ActorSession> sessions;
 final Map<String, dynamic> operations;
 final bool verifiedTest;
 LogisticsClient(this.sessions, this.operations, {this.verifiedTest=false});
 Future<dynamic> run(String name, Map<String,String> values) async {
  final op=operations[name]; if(op==null) throw StateError('Unknown operation');
  final session=sessions[op['actor']]; if(session==null) throw StateError('Missing ${op['actor']} session');
  if(op['testOnly']==true && !verifiedTest) throw StateError('Verify sandbox provider and original payment reference');
  String replace(String s,{bool url=false})=>s.replaceAllMapped(RegExp(r'\{([A-Z_]+)\}'),(m){final v=values[m[1]];if(v==null||v.isEmpty)throw StateError('Missing ${m[1]}');return url?Uri.encodeComponent(v):v;});
  dynamic expand(dynamic v){if(v is String)return replace(v);if(v is List)return v.map(expand).toList();if(v is Map)return v.map((k,x)=>MapEntry(k,expand(x)));return v;}
  final req=http.Request(op['method'],Uri.parse(session.origin.replaceAll(RegExp(r'/$'),'')+replace(op['path'],url:true)));
  req.headers.addAll({'orgid':session.orgId,'Authorization':'Bearer ${session.token}','Content-Type':'application/json'});
  if(op.containsKey('body'))req.body=jsonEncode(expand(op['body']));
  final transport=http.Client();
  late final http.Response response;
  try{response=await http.Response.fromStream(await transport.send(req));}finally{transport.close();}
  final result=jsonDecode(response.body);
  if(response.statusCode>=400)throw StateError('AppEngine ${response.statusCode}: $result');
  return result;
 }
}
// Add http to pubspec.yaml. Bundle http/operations.json as a Flutter asset and load it
// using rootBundle.loadString. Store customer tokens using your application's secure
// session mechanism. A driver client does not carry a staff token for approval.
