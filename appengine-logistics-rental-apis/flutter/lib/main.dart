import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'logistics_client.dart';
void main()=>runApp(MaterialApp(title:'AppEngine Driver',theme:ThemeData(colorScheme:ColorScheme.fromSeed(seedColor:const Color(0xff7138d7)),useMaterial3:true),home:const DriverScreen()));
class DriverScreen extends StatefulWidget{const DriverScreen({super.key});@override State<DriverScreen> createState()=>_DriverState();}
class _DriverState extends State<DriverScreen>{
 final origin=TextEditingController(),org=TextEditingController(),token=TextEditingController(),job=TextEditingController();
 Map<String,dynamic> ops={},data={};bool busy=false;String error='';
 @override void initState(){super.initState();rootBundle.loadString('assets/operations.json').then((s){if(mounted)setState(()=>ops=jsonDecode(s));});}
 @override void dispose(){for(final c in[origin,org,token,job]){c.dispose();}super.dispose();}
 Future<void> run(String name)async{setState((){busy=true;error='';});try{
  if([origin,org,token,job].any((x)=>x.text.trim().isEmpty))throw StateError('Complete the origin, organization, customer token and assigned job number.');
  final client=LogisticsClient({'driver':ActorSession(origin.text.trim(),org.text.trim(),token.text.trim())},ops);
  final values={'JOB_NUMBER':job.text.trim()};await client.run(name,values);final result=await client.run('delivery_read',values);
  if(mounted)setState(()=>data=Map<String,dynamic>.from(result['data']??result));
 }catch(e){if(mounted)setState(()=>error=e.toString());}finally{if(mounted)setState(()=>busy=false);}}
 Widget field(String label,TextEditingController c,{bool secret=false})=>Padding(padding:const EdgeInsets.only(bottom:14),child:TextField(controller:c,obscureText:secret,autocorrect:false,enableSuggestions:!secret,decoration:InputDecoration(labelText:label,border:const OutlineInputBorder())));
 @override Widget build(BuildContext context)=>Scaffold(appBar:AppBar(title:const Text('Driver workspace')),body:ListView(padding:const EdgeInsets.all(22),children:[
 const Text('AppEngine customer session',style:TextStyle(fontSize:24,fontWeight:FontWeight.bold)),const SizedBox(height:12),const Text('Sign in through the API Foundations flow. Use only the driver’s customer token; staff approves drivers in the dispatch app.'),const SizedBox(height:20),
 field('Assigned AppEngine API origin',origin),field('Organization ID',org),field('Customer bearer token',token,secret:true),field('Assigned job number',job),
 FilledButton(onPressed:busy||ops.isEmpty?null:()=>run('delivery_read'),child:const Text('Load saved job')),
 if(busy)const Padding(padding:EdgeInsets.all(16),child:LinearProgressIndicator()),if(error.isNotEmpty)Text(error,style:TextStyle(color:Theme.of(context).colorScheme.error)),
 if(data.isNotEmpty)...[const SizedBox(height:20),Text('Saved status: ${data['status']}',style:const TextStyle(fontSize:22,fontWeight:FontWeight.bold)),
 for(final stop in(data['stops']??[]))Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text('${stop['type']} · ${stop['status']}',style:const TextStyle(fontSize:20,fontWeight:FontWeight.w600)),Text('${stop['location']?['address']??''}'),Text('${stop['proof']?['notes']??'Proof not recorded'}')]))),
 for(final a in const[['delivery_accept','Accept offer'],['delivery_start_pickup','Start pickup'],['delivery_arrive_pickup','Arrive at pickup'],['delivery_complete_pickup','Confirm collection'],['delivery_start_dropoff','Start dropoff'],['delivery_arrive_dropoff','Arrive at destination'],['delivery_complete_dropoff','Record handover'],['delivery_complete','Complete job']])Padding(padding:const EdgeInsets.only(top:10),child:OutlinedButton(onPressed:busy?null:()=>run(a[0]),child:Text(a[1]))),
 if(data['earnings']!=null)Padding(padding:const EdgeInsets.symmetric(vertical:20),child:Text('Internal earnings: ${data['earnings']['driverTotal']} · ${data['earnings']['status']}. No payout action is included.')),
 const Text('These demonstration actions use the course’s two-box handover text. Collect actual proof before using this interface in production.')],
 const SizedBox(height:20),const Text('Session values stay in memory and are cleared when the app closes. Use your secure session manager in a deployed client.') ]));
}
