import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:connected_client_demo/main.dart' as app;
void main(){IntegrationTestWidgetsFlutterBinding.ensureInitialized();
 testWidgets('Recorded native continuation of the web booking',(tester)async{
  void mark(String name)=>debugPrint('CAPTURE_MARK ${jsonEncode({'name':name,'epoch':DateTime.now().millisecondsSinceEpoch})}');
  Future<void> hold(int seconds)async{await Future<void>.delayed(Duration(seconds:seconds));await tester.pump();}
  app.main();await tester.pumpAndSettle();final state=tester.state<app.BookingHomeState>(find.byType(app.BookingHome));
  if(state.client.auth.isSignedIn){await state.client.auth.signOut();await tester.pumpAndSettle();}
  mark('signin-start');await hold(3);
  await tester.enterText(find.byKey(const Key('email')),const String.fromEnvironment('MIRA_EMAIL'));await hold(2);
  await tester.enterText(find.byKey(const Key('password')),const String.fromEnvironment('MIRA_PASSWORD'));await hold(2);
  await tester.tap(find.byKey(const Key('signin')));await tester.pumpAndSettle();expect(state.client.auth.isSignedIn,true);await hold(3);
  await tester.tap(find.text('My bookings'));await tester.pumpAndSettle();
  final id=const String.fromEnvironment('CAPTURE_BOOKING_ID');expect(id,isNotEmpty);
  final row=state.bookings.firstWhere((r)=>r['sk']==id);expect(row['data']['status'],isNot('cancelled'));final reference=row['data']['name'];final before=Map<String,dynamic>.from(row);
  await tester.scrollUntilVisible(find.byKey(const Key('refresh')),-400,scrollable:find.byType(Scrollable).first);await tester.pumpAndSettle();await tester.pumpAndSettle();mark('same-booking-visible');await hold(9);
  await tester.scrollUntilVisible(find.byKey(const Key('refresh')),-250,scrollable:find.byType(Scrollable).first);await tester.pumpAndSettle();await tester.tap(find.byKey(const Key('refresh')));await tester.pumpAndSettle();await tester.scrollUntilVisible(find.byKey(const Key('refresh')),-400,scrollable:find.byType(Scrollable).first);await tester.pumpAndSettle();await hold(4);mark('mobile-read-end');await hold(2);
  mark('changes-start');await tester.ensureVisible(find.byKey(Key('move-$id')));await hold(2);await tester.tap(find.byKey(Key('move-$id')));await tester.pumpAndSettle();await hold(4);
  final choices=find.descendant(of:find.byType(AlertDialog),matching:find.byType(OutlinedButton));await tester.tap(choices.first);await tester.pumpAndSettle();expect(state.lastSaved!['data']['name'],reference);await tester.scrollUntilVisible(find.byKey(const Key('refresh')),-400,scrollable:find.byType(Scrollable).first);await tester.pumpAndSettle();final moved=Map<String,dynamic>.from(state.lastSaved!);mark('moved');await hold(7);
  await tester.tap(find.byKey(Key('cancel-$id')));await tester.pumpAndSettle();await hold(5);await tester.tap(find.byKey(const Key('confirm-cancel')));await tester.pumpAndSettle();expect(state.lastSaved!['data']['status'],'cancelled');await tester.scrollUntilVisible(find.byKey(const Key('refresh')),-400,scrollable:find.byType(Scrollable).first);await tester.pumpAndSettle();mark('cancelled');await hold(7);
  await tester.scrollUntilVisible(find.byKey(const Key('refresh')),-250,scrollable:find.byType(Scrollable).first);await tester.pumpAndSettle();await tester.tap(find.byKey(const Key('refresh')));await tester.pumpAndSettle();await tester.scrollUntilVisible(find.byKey(const Key('refresh')),-400,scrollable:find.byType(Scrollable).first);await tester.pumpAndSettle();await hold(5);mark('changes-end');
  debugPrint('CROSS_DEVICE_RESULT ${jsonEncode({'bookingId':id,'reference':reference,'before':before,'moved':moved,'final':state.lastSaved,'calls':state.client.http.calls})}');
 });
}
