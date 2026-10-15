import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'customer_transport.dart';
import 'customer_session_store.dart';
class BookingClient {
  BookingClient({required String base,required String organization,SessionStore? store})
    : http=CustomerTransport(base:base,organization:organization){auth=AppmintAuth(http,store??CustomerSessionStore(organization));}
  final CustomerTransport http;late final AppmintAuth auth;
  Future<List<dynamic>> definitions()async=>(await http.get('/crm/reservations/definitions',sendUserToken:false))['data'];
  Future<Map<String,dynamic>> slots(String definition,String service,String day)async=>Map<String,dynamic>.from(await http.post('/crm/reservations/slots',body:{'reservationDefinitionId':definition,'serviceName':service,'serviceDate':day}));
  Future<Map<String,dynamic>> intakeSchema(dynamic configured)async{
    if(configured==null||configured=='')return {};
    if(configured is Map){
      final schema=configured['data'] is Map ? configured['data']['schema'] : configured['schema'];
      if(schema is! Map || schema['properties'] is! Map)throw const AppmintException('The configured booking form has no usable schema.');
      return Map<String,dynamic>.from(schema);
    }
    final rows=await http.get('/repository/collections/${Uri.encodeComponent('$configured')}');
    final row=(rows as List).where((x)=>x['data']?['name']==configured).firstOrNull;
    if(row==null)throw AppmintException('The configured booking form could not be loaded: $configured');
    final schema=row['data']['schema'];
    if(schema is! Map || schema['properties'] is! Map)throw const AppmintException('The configured booking form has no usable schema.');
    return Map<String,dynamic>.from(schema);
  }
  Future<Map<String,dynamic>> book(String definition,String service,String start,{String? end,Map<String,dynamic>? answers})async=>Map<String,dynamic>.from(await http.post('/client-data/reservations',body:{'reservationDefinitionId':definition,'service':service,'startTime':start,'endTime':?end,'form':?answers}));
  Future<Map<String,dynamic>> read(String id)async=>Map<String,dynamic>.from(await http.get('/client-data/reservations/$id'));
  Future<List<dynamic>> mine()async=>(await http.get('/client-data/reservations'))['data'];
  Future<Map<String,dynamic>> move(String id,String start)async=>Map<String,dynamic>.from(await http.post('/crm/reservations/reschedule/$id',body:{'startTime':start,'reason':'Changed from the client','notify':false}));
  /// This legacy cancel route uses email + code. The owned-detail preflight
  /// protects this client's action; it does not change direct API semantics.
  Future<Map<String,dynamic>> cancel(String id)async {
    final row=await read(id);final d=row['data'];
    return Map<String,dynamic>.from(await http.delete('/crm/reservations/cancel/${Uri.encodeComponent(d['customer']['email'])}/${Uri.encodeComponent(d['name'])}'));
  }
}
