import 'dart:convert';
import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Host storage policy for the official AppmintAuth interface.
/// All token-bearing values, including remembered sessions, use the OS vault.
/// Each organization has its own key prefix; no unrelated app data is deleted.
class CustomerSessionStore implements SessionStore {
  CustomerSessionStore(String organization)
      : prefix='juniper.customer.$organization.';
  final String prefix;
  final FlutterSecureStorage vault=const FlutterSecureStorage(
    aOptions:AndroidOptions(encryptedSharedPreferences:true),
  );
  Future<String?> get(String key)=>vault.read(key:prefix+key);
  Future<void> put(String key,String value)=>vault.write(key:prefix+key,value:value);
  Future<void> remove(String key)=>vault.delete(key:prefix+key);
  @override Future<String?> readAccessToken()=>get('access');
  @override Future<String?> readRefreshToken()=>get('refresh');
  @override Future<void> writeTokens(String access,String refresh)async{
    await put('access',access);await put('refresh',refresh);
  }
  @override Future<void> clearTokens()async{await remove('access');await remove('refresh');}
  @override Future<Map<String,dynamic>?> readUser()async{
    final raw=await get('user');return raw==null?null:Map<String,dynamic>.from(jsonDecode(raw));
  }
  @override Future<void> writeUser(Map<String,dynamic> user)=>put('user',jsonEncode(user));
  @override Future<List<SavedSession>> readSavedSessions()async{
    final raw=await get('remembered');
    if(raw==null)return <SavedSession>[]; // Auth deliberately mutates this list.
    return (jsonDecode(raw) as List).map((v)=>SavedSession.fromJson(Map<String,dynamic>.from(v))).toList();
  }
  @override Future<void> writeSavedSessions(List<SavedSession> sessions)=>
    put('remembered',jsonEncode(sessions.map((v)=>v.toJson()).toList()));
  @override Future<void> clearSession()async{await clearTokens();await remove('user');}
}
