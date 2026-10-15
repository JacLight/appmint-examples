import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:appengine_phone_demo/main.dart';
import 'package:appengine_phone_demo/phone_model.dart';

void main() {
  test('registration is not SDK readiness or call acceptance', () async {
    final m = PhoneModel();
    addTearDown(m.dispose);
    await m.connect();
    expect(m.registered, true);
    expect(m.ready, false);
    expect(() => m.dial('+12025550118'), throwsStateError);
    m.sdkRegistered();
    m.dial('+12025550118');
    expect(m.call, CallState.dialing);
    m.answer();
    expect(m.call, CallState.connected);
    m.incoming();
    expect(m.call, CallState.connected);
    expect(m.calls.first['status'], 'busy — rejected');
    m.end();
    expect(m.calls.first['status'], 'completed');
    await m.disconnect();
  });
  test('late registration is removed after logout', () async {
    final response = Completer<Map<String, dynamic>>();
    var removals = 0;
    final m = PhoneModel(
      api: PhoneApi((method, path, body, query) async {
        if (path.endsWith('register-device') &&
            !path.endsWith('unregister-device')) {
          return response.future;
        }
        if (path.endsWith('unregister-device')) removals++;
        return {};
      }),
    );
    addTearDown(m.dispose);
    final connect = m.connect();
    final logout = m.disconnect();
    response.complete({'voiceAvailable': true, 'outboundReady': true});
    await connect;
    await logout;
    expect(m.ready, false);
    expect(m.registered, false);
    expect(removals, 1);
  });
  test('SMS uses send query and retains pending versus delivered', () async {
    final fixture = SimulatedAppEngine();
    final m = PhoneModel(api: PhoneApi(fixture.request));
    addTearDown(m.dispose);
    await m.send('+12025550118', 'Hello');
    expect(m.messages.single['status'], 'pending');
    m.messageStatus(m.messages.single, 'delivered');
    expect(m.messages.single['status'], 'delivered');
    expect(fixture.messages, 1);
  });
  test('offline SDK stops heartbeat and blocks dialing', () async {
    final fixture = SimulatedAppEngine();
    final m = PhoneModel(
      api: PhoneApi(fixture.request),
      heartbeatInterval: const Duration(milliseconds: 5),
    );
    addTearDown(m.dispose);
    await m.connect();
    m.sdkRegistered();
    m.networkError();
    final count = fixture.requests.length;
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(fixture.requests.length, count);
    expect(() => m.dial('+12025550118'), throwsStateError);
  });
  testWidgets(
    'small screen shows simulator and registration stages without overflow',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(const PhoneApp());
      expect(find.textContaining('SIMULATED PROVIDER'), findsOneWidget);
      await tester.tap(find.text('Register installation'));
      await tester.pumpAndSettle();
      expect(find.text('Registered — awaiting voice SDK'), findsOneWidget);
      await tester.tap(find.text('Simulate SDK ready'));
      await tester.pumpAndSettle();
      expect(find.text('Voice SDK ready'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      await tester.pumpAndSettle();
    },
  );
}
