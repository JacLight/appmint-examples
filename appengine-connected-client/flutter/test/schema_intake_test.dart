import 'package:flutter_test/flutter_test.dart';
import 'package:connected_client_demo/schema_intake.dart';
import 'package:connected_client_demo/booking_client.dart';
void main(){
 test('Configured intake validates required, length, enum and consent',(){
  expect(SchemaIntake.validateValue('brief',{'type':'string','minLength':12},'',['brief']),isNotNull);
  expect(SchemaIntake.validateValue('brief',{'type':'string','minLength':12},'Short',['brief']),isNotNull);
  expect(SchemaIntake.validateValue('brief',{'type':'string','minLength':12},'A reading corner with shelves',['brief']),isNull);
  expect(SchemaIntake.validateValue('project',{'type':'string','enum':['Single room','Whole home']},'Other',[]),isNotNull);
  expect(SchemaIntake.validateValue('consent',{'type':'boolean','const':true},false,['consent']),isNotNull);
  expect(SchemaIntake.validateValue('consent',{'type':'boolean','const':true},true,['consent']),isNull);
 });
 test('Unsupported configured controls are explicit',(){
  expect(SchemaIntake.unsupported({'properties':{'plans':{'type':'string','x-control':'file'}}}),['plans']);
  expect(SchemaIntake.unsupported({'properties':{},'allOf':[]}),contains('schema.allOf'));
  expect(SchemaIntake.unsupported({'properties':{'age':{'type':'integer','multipleOf':2}}}),['age']);
  expect(SchemaIntake.unsupported({'properties':{},'required':['missing']}),contains('required:missing'));
  expect(SchemaIntake.validateValue('age',{'type':'number'},'invalid',[]),isNotNull);
 });
 test('Configured enriched form cannot silently become no form',()async{
  final client=BookingClient(base:'https://example.invalid',organization:'test');
  await expectLater(client.intakeSchema({'data':{'name':'broken'}}),throwsA(isA<Exception>()));
  expect(await client.intakeSchema(null),isEmpty);
  expect(await client.intakeSchema({'data':{'schema':{'type':'object','properties':{}}}}),{'type':'object','properties':{}});
 });
}
