import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:connected_client_demo/main.dart' as app;
void main(){IntegrationTestWidgetsFlutterBinding.ensureInitialized();
 testWidgets('Definition service schema intake and saved answers on native iOS',(tester)async{
  app.main();await tester.pumpAndSettle();final state=tester.state<app.BookingHomeState>(find.byType(app.BookingHome));
  if(state.client.auth.isSignedIn){await state.client.auth.signOut();await tester.pumpAndSettle();}
  await tester.enterText(find.byKey(const Key('email')),const String.fromEnvironment('MIRA_EMAIL'));await tester.enterText(find.byKey(const Key('password')),const String.fromEnvironment('MIRA_PASSWORD'));await tester.tap(find.byKey(const Key('signin')));await tester.pumpAndSettle(const Duration(milliseconds:200));
  expect(state.definition!['sk'],const String.fromEnvironment('DEFINITION_ID'));expect(state.intake['required'],contains('brief'));expect(state.service,'Room planning');
  debugPrint('FORM_STAGE definition');await Future<void>.delayed(const Duration(seconds:4));
  final serviceField=find.byKey(ValueKey('service-${state.definition!['sk']}-${state.service}'));await tester.ensureVisible(serviceField);await tester.tap(serviceField);await tester.pumpAndSettle();await tester.tap(find.text('Whole-home consultation • 60 minutes').last);await tester.pumpAndSettle(const Duration(milliseconds:200));expect(state.service,'Whole-home consultation');expect(state.selected,isNull);expect(state.chosenService['duration'],60);
  debugPrint('FORM_STAGE service');await Future<void>.delayed(const Duration(seconds:4));
  await tester.tap(find.byKey(ValueKey('service-${state.definition!['sk']}-${state.service}')));await tester.pumpAndSettle();await tester.tap(find.text('Room planning • 30 minutes').last);await tester.pumpAndSettle(const Duration(milliseconds:200));
  final slot=state.slots.first;await tester.ensureVisible(find.byKey(Key('slot-${slot['startTime']}')));await tester.tap(find.byKey(Key('slot-${slot['startTime']}')));await tester.pump();
  final writesBefore=state.client.http.calls.where((r)=>r['method']=='POST'&&r['path']=='/client-data/reservations').length;
  await tester.ensureVisible(find.byKey(const Key('book')));await tester.tap(find.byKey(const Key('book')));await tester.pumpAndSettle();expect(state.client.http.calls.where((r)=>r['method']=='POST'&&r['path']=='/client-data/reservations').length,writesBefore);expect(state.lastSaved,isNull);
  debugPrint('FORM_STAGE required');await Future<void>.delayed(const Duration(seconds:4));
  await tester.ensureVisible(find.byKey(const Key('intake-projectType')));await tester.tap(find.byKey(const Key('intake-projectType')));await tester.pumpAndSettle();await tester.tap(find.text('Single room').last);await tester.pumpAndSettle();
  await tester.ensureVisible(find.byKey(const Key('intake-brief')));await tester.enterText(find.byKey(const Key('intake-brief')),'Plan a reading corner with accessible shelving.');FocusManager.instance.primaryFocus?.unfocus();await tester.pumpAndSettle();
  await tester.ensureVisible(find.byKey(const Key('intake-contactConsent')));await tester.tap(find.descendant(of:find.byKey(const Key('intake-contactConsent')),matching:find.byType(CheckboxListTile)));await tester.pumpAndSettle();
  debugPrint('FORM_STAGE answers');await Future<void>.delayed(const Duration(seconds:4));
  await tester.ensureVisible(find.byKey(const Key('book')));await tester.tap(find.byKey(const Key('book')));await tester.pumpAndSettle(const Duration(milliseconds:250));expect(state.lastSaved,isNotNull);final row=state.lastSaved!,d=row['data'];expect(d['form']['projectType'],'Single room');expect(d['form']['brief'],'Plan a reading corner with accessible shelving.');expect(d['form']['contactConsent'],true);
  await tester.ensureVisible(find.byKey(Key('booking-${row['sk']}')));await tester.pumpAndSettle();debugPrint('FORM_STAGE saved');await Future<void>.delayed(const Duration(seconds:4));
  await state.client.cancel(row['sk']);final cancelled=await state.client.read(row['sk']);expect(cancelled['data']['status'],'cancelled');expect(cancelled['data']['form'],d['form']);
  debugPrint('FORM_RESULT ${jsonEncode({'runtime':'native iOS','definitionId':state.definition!['sk'],'service':'Room planning','schemaResolved':true,'clientRequiredPreventedPost':true,'serviceChangeClearedSlot':true,'bookingId':row['sk'],'reference':d['name'],'savedAnswers':d['form'],'cancelled':true,'answersAfterCancel':cancelled['data']['form'],'calls':state.client.http.calls})}');
 });
}
