import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:appmint_flutter_client/appmint_flutter_client.dart';
import 'package:connected_client_demo/main.dart' as app;
import 'package:connected_client_demo/booking_client.dart';

void main(){IntegrationTestWidgetsFlutterBinding.ensureInitialized();
 testWidgets('Customer books, changes, cancels and remains isolated on native iOS',(tester)async{
  debugPrint('COURSE_STAGE boot');app.main();await tester.pumpAndSettle();final state=tester.state<app.BookingHomeState>(find.byType(app.BookingHome));
  if(state.client.auth.isSignedIn){await state.client.auth.signOut();await tester.pumpAndSettle();}
  await tester.enterText(find.byKey(const Key('email')),const String.fromEnvironment('MIRA_EMAIL'));await tester.enterText(find.byKey(const Key('password')),const String.fromEnvironment('MIRA_PASSWORD'));await tester.tap(find.byKey(const Key('signin')));await tester.pumpAndSettle(const Duration(milliseconds:250));expect(state.client.auth.isSignedIn,true);expect(state.slots,isNotEmpty);
  debugPrint('COURSE_STAGE signed-in-slots-loaded');final slot=state.slots.firstWhere((s)=>(s['spotsAvailable']as num? ??1)>0);await tester.ensureVisible(find.byKey(Key('slot-${slot['startTime']}')));await tester.tap(find.byKey(Key('slot-${slot['startTime']}')));await tester.pump();await tester.ensureVisible(find.byKey(const Key('book')));await tester.tap(find.byKey(const Key('book')));await tester.pumpAndSettle(const Duration(milliseconds:250));expect(state.lastSaved,isNotNull);final id=state.lastSaved!['sk'] as String;final original=state.lastSaved!['data']['startTime'];final code=state.lastSaved!['data']['name'];
  debugPrint('COURSE_STAGE booking-created');final other=BookingClient(base:const String.fromEnvironment('APPENGINE_URL'),organization:const String.fromEnvironment('APPENGINE_ORG'),store:MemorySessionStore());expect(await other.auth.customers.signIn(const String.fromEnvironment('TOM_EMAIL'),const String.fromEnvironment('TOM_PASSWORD')),isA<SignedIn>());await expectLater(other.read(id),throwsA(isA<AppmintException>().having((e)=>e.statusCode,'status',404)));expect((await other.mine()).any((r)=>r['sk']==id),false);
  debugPrint('COURSE_STAGE other-customer-isolated');await tester.ensureVisible(find.byKey(Key('move-$id')));await tester.tap(find.byKey(Key('move-$id')));await tester.pumpAndSettle(const Duration(milliseconds:250));expect(find.text('Choose a new time'),findsOneWidget);final choices=find.descendant(of:find.byType(AlertDialog),matching:find.byType(OutlinedButton));await tester.tap(choices.first);await tester.pumpAndSettle(const Duration(milliseconds:250));expect(state.lastSaved!['data']['startTime'],isNot(original));expect(state.lastSaved!['data']['name'],code);final moved=state.lastSaved!['data']['startTime'];
  debugPrint('COURSE_STAGE booking-moved');await tester.ensureVisible(find.byKey(Key('cancel-$id')));await tester.tap(find.byKey(Key('cancel-$id')));await tester.pumpAndSettle();await tester.tap(find.byKey(const Key('confirm-cancel')));await tester.pumpAndSettle(const Duration(milliseconds:250));expect(state.lastSaved!['data']['status'],'cancelled');
  final fresh=await state.client.auth.refreshSession();expect(fresh,isNotEmpty);expect((await state.client.read(id))['data']['status'],'cancelled');
  debugPrint('COURSE_RESULT ${jsonEncode({'runtime':'native iOS simulator','customer':'Mira','bookingId':id,'reference':code,'before':original,'after':moved,'finalStatus':'cancelled','otherCustomerDetail':404,'otherCustomerListContainsBooking':false,'refresh':true,'officialPackage':'appmint_flutter_client','calls':state.client.http.calls})}');
  await state.client.auth.signOut();await other.auth.signOut();await tester.pumpAndSettle();expect(find.byKey(const Key('signin')),findsOneWidget);
 });
}
