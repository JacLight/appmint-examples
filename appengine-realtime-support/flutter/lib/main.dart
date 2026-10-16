import 'dart:convert';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:appmint_flutter_chat/appmint_flutter_chat.dart';

// Course-local host wiring. The controller, rendering and Socket.IO transport
// are the existing official appmint_flutter_chat package, unchanged.
void main()=>runApp(MaterialApp(debugShowCheckedModeBanner:false,builder:(context,child)=>MediaQuery(data:MediaQuery.of(context).copyWith(textScaler:const TextScaler.linear(1.35)),child:child!),title:'Appmint Support Integration',theme:ThemeData(useMaterial3:true,colorScheme:ColorScheme.fromSeed(seedColor:const Color(0xff7534ee))),home:const HostApp()));
class HostApp extends StatefulWidget{const HostApp({super.key});@override State<HostApp> createState()=>_HostAppState();}
class _HostAppState extends State<HostApp>{
 final email=TextEditingController(),password=TextEditingController();Map<String,dynamic>? settings;String? token,error;bool loading=false;
 @override void initState(){super.initState();load();}
 Future<void> load()async{try{final r=await http.get(Uri.base.resolve('/course-settings'));settings=jsonDecode(r.body);setState((){});}catch(e){setState(()=>error='Could not load connection settings.');}}
 Future<void> signIn()async{setState((){loading=true;error=null;});try{
 final r=await http.post(Uri.parse('${settings!['endpoint']}/profile/customer/signin'),headers:{'Content-Type':'application/json','orgid':settings!['org']},body:jsonEncode({'email':email.text.trim().toLowerCase(),'password':password.text}));
 final body=jsonDecode(r.body) as Map<String,dynamic>;if(body['requiresTwoFactor']==true || body['requiresPasswordChange']==true)throw Exception('Complete the account sign-in requirements from API Foundations before opening this chat example.');if(r.statusCode>=400||body['token']==null)throw Exception(body['message']??'Sign-in failed');token=body['token'];
 final prefs=await SharedPreferences.getInstance();final key='support-session:${settings!['org']}:${email.text.trim().toLowerCase()}';
 final config=AppmintChatConfig(endpoint:settings!['endpoint'],orgId:settings!['org'],configId:settings!['configId'],user:AppmintChatUser(email:email.text.trim().toLowerCase(),name:[body['customer']?['data']?['firstName'],body['customer']?['data']?['lastName']].where((v)=>v!=null).join(' ')),token:()async=>token,supportName:'Integration Help',welcome:'Ask about adding Appmint support to your application.',loadSessionId:()async=>prefs.getString(key),saveSessionId:(id)async{await prefs.setString(key,id);});
 if(!mounted)return;await Navigator.push(context,MaterialPageRoute(builder:(_)=>Scaffold(appBar:AppBar(title:const Text('Appmint Support Integration · official Flutter component')),body:Center(child:ConstrainedBox(constraints:const BoxConstraints(maxWidth:1400),child:AppmintSupportChatScreen(config:config,onPickAttachments:(_)async{final picked=await FilePicker.platform.pickFiles(withData:true,allowMultiple:true);return picked?.files.where((f)=>f.bytes!=null).map((f)=>AppmintChatAttachment(bytes:f.bytes!,name:f.name,mimeType:f.extension=='txt'?'text/plain':'application/octet-stream')).toList();},theme:const AppmintChatTheme(accent:Color(0xff7534ee))))))));setState(()=>loading=false);
 }catch(e){setState((){error=e.toString();loading=false;});}}
 @override void dispose(){email.dispose();password.dispose();super.dispose();}
 @override Widget build(BuildContext context)=>Scaffold(backgroundColor:const Color(0xfff7f5fc),appBar:AppBar(title:const Text('Appmint Support Integration')),body:Center(child:SizedBox(width:460,child:Card(child:Padding(padding:const EdgeInsets.all(28),child:Column(mainAxisSize:MainAxisSize.min,crossAxisAlignment:CrossAxisAlignment.stretch,children:[const Text('Open your support conversation',style:TextStyle(fontSize:25,fontWeight:FontWeight.w700)),const SizedBox(height:14),const Text('Sign in with your existing customer account. Your session connects this app to AppEngine.'),const SizedBox(height:24),TextField(controller:email,decoration:const InputDecoration(labelText:'Customer email',border:OutlineInputBorder())),const SizedBox(height:16),TextField(controller:password,obscureText:true,decoration:const InputDecoration(labelText:'Password',border:OutlineInputBorder())),const SizedBox(height:24),FilledButton(onPressed:loading||settings==null?null:signIn,child:Text(loading?'Signing in…':'Sign in and open support')),if(error!=null)Text(error!,style:const TextStyle(color:Colors.red))]))))));
}
