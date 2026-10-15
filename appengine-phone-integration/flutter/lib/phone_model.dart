import 'dart:async';

import 'package:flutter/foundation.dart';

typedef AppEngineRequest = Future<Map<String, dynamic>> Function(
  String method,
  String path,
  Map<String, dynamic>? body,
  Map<String, String> query,
);

/// Inject your application's authenticated staff transport. No credentials here.
class PhoneApi {
  PhoneApi(this.request);
  final AppEngineRequest request;
  Future<Map<String, dynamic>> register(String id, String platform) =>
      request('POST', '/phone/voice/register-device', {
        'deviceId': id,
        'platform': platform,
        'capabilities': ['voice'],
      }, {});
  Future<Map<String, dynamic>> heartbeat(String id) =>
      request('POST', '/phone/voice/heartbeat', {'deviceId': id}, {});
  Future<Map<String, dynamic>> unregister(String id) =>
      request('POST', '/phone/voice/unregister-device', {'deviceId': id}, {});
  Future<Map<String, dynamic>> sendSms(String from, String to, String text) {
    if (to.trim().isEmpty || text.trim().isEmpty) {
      throw ArgumentError('Enter a recipient and message');
    }
    return request(
      'POST',
      '/crm/inbox/update',
      {
        'data': {
          'deliveryType': 'sms',
          'from': from,
          'to': [to],
          'text': text,
        },
      },
      {'send': 'true'},
    );
  }
}

/// Bounded AppEngine fixture: no network, provider key or real voice token.
class SimulatedAppEngine {
  final devices = <String>{};
  final requests = <String>[];
  int messages = 0;
  Future<Map<String, dynamic>> request(
    String method,
    String path,
    Map<String, dynamic>? body,
    Map<String, String> query,
  ) async {
    requests.add('$method $path');
    switch (path) {
      case '/phone/voice/register-device':
        devices.add(body!['deviceId'] as String);
        return {
          'voiceAvailable': true,
          'outboundReady': true,
          'token': 'SIMULATION-NOT-A-VOICE-TOKEN',
          'identity': 'simulated-staff',
        };
      case '/phone/voice/unregister-device':
        devices.remove(body!['deviceId']);
        return {'ok': true};
      case '/phone/voice/heartbeat':
        if (!devices.contains(body!['deviceId'])) {
          throw StateError('Installation is not registered');
        }
        return {'ok': true};
      case '/crm/inbox/update':
        return {
          'sk': 'sim-message-${++messages}',
          'data': {
            ...body!['data'] as Map<String, dynamic>,
            'status': query['send'] == 'true' ? 'pending' : 'draft',
          },
        };
      default:
        throw UnsupportedError('Not part of this simulator: $path');
    }
  }
}

enum CallState { idle, dialing, incoming, connected }

/// Client state owner. Provider events are invoked by simulation controls here.
/// Bind real native SDK events to equivalent transitions in your production app.
class PhoneModel extends ChangeNotifier {
  PhoneModel({
    PhoneApi? api,
    this.heartbeatInterval = const Duration(seconds: 30),
  }) : api = api ?? PhoneApi(SimulatedAppEngine().request);
  final PhoneApi api;
  final Duration heartbeatInterval;
  // Stable for this in-memory exercise. Persist a generated installation ID in
  // your real app; do not copy this value into a deployed native client.
  final deviceId = 'flutter-simulated-installation';
  final assignedLines = const ['+12025550110', '+12025550111'];
  String selectedLine = '+12025550110';
  String connection = 'Offline';
  String? error;
  bool registered = false, ready = false, connecting = false, sending = false;
  bool muted = false;
  CallState call = CallState.idle;
  String peer = '', digits = '';
  final calls = <Map<String, String>>[];
  final messages = <Map<String, dynamic>>[];
  Timer? _heartbeat;
  int _epoch = 0;
  bool _disposed = false;
  Future<void>? _pending, _stopping;
  void _emit() {
    if (!_disposed) notifyListeners();
  }

  Future<void> connect() {
    if (_stopping != null) return _stopping!.then((_) => connect());
    if (_pending != null) return _pending!;
    if (registered) return Future.value();
    final epoch = ++_epoch;
    connecting = true;
    error = null;
    connection = 'Registering installation';
    _emit();
    final future = _connect(epoch);
    _pending = future;
    future.then((_) {
      if (identical(_pending, future)) _pending = null;
    });
    return future;
  }

  Future<void> _connect(int epoch) async {
    try {
      final result = await api.register(deviceId, 'ios');
      if (epoch != _epoch || _disposed) {
        await api.unregister(deviceId);
        return;
      }
      if (result['voiceAvailable'] != true || result['outboundReady'] != true) {
        await api.unregister(deviceId);
        connection = 'Service unavailable';
        return;
      }
      registered = true;
      connection = 'Registered — awaiting voice SDK';
    } catch (e) {
      if (epoch == _epoch) {
        error = '$e';
        connection = 'Registration failed';
      }
    } finally {
      if (epoch == _epoch) connecting = false;
      _emit();
    }
  }

  void sdkRegistered() {
    if (!registered || ready) return;
    ready = true;
    connection = 'Voice SDK ready';
    error = null;
    final epoch = _epoch;
    _heartbeat?.cancel();
    _heartbeat = Timer.periodic(heartbeatInterval, (_) async {
      if (_disposed || epoch != _epoch || !ready) return;
      try {
        await api.heartbeat(deviceId);
      } catch (e) {
        if (epoch == _epoch) networkError('$e');
      }
    });
    _emit();
  }

  Future<void> disconnect() {
    if (_stopping != null) return _stopping!;
    ++_epoch;
    _heartbeat?.cancel();
    final hadRegistration = registered;
    registered = false;
    ready = false;
    connecting = false;
    if (call != CallState.idle) _finish('disconnected');
    connection = 'Offline';
    _emit();
    final future = () async {
      // A registration arriving after logout compensates itself in _connect.
      await _pending;
      if (hadRegistration) {
        try {
          await api.unregister(deviceId);
        } catch (e) {
          error = 'Registration cleanup failed: $e';
          _emit();
        }
      }
    }();
    _stopping = future;
    future.then((_) {
      if (identical(_stopping, future)) _stopping = null;
    });
    return future;
  }

  void dial(String destination) {
    if (!ready || call != CallState.idle) {
      throw StateError('Connect and finish the current call first');
    }
    if (!RegExp(r'^\+[1-9]\d{6,14}$').hasMatch(destination)) {
      throw ArgumentError('Use an E.164 recipient');
    }
    peer = destination;
    call = CallState.dialing;
    muted = false;
    digits = '';
    _emit();
  }

  void incoming() {
    if (!ready) return;
    if (call != CallState.idle) {
      calls.insert(0, {
        'peer': '+12025550119',
        'status': 'busy — rejected',
        'line': selectedLine,
      });
      _emit();
      return;
    }
    peer = '+12025550118';
    call = CallState.incoming;
    muted = false;
    digits = '';
    _emit();
  }

  void answer() {
    if (call != CallState.incoming && call != CallState.dialing) return;
    call = CallState.connected;
    _emit();
  }

  void toggleMute() {
    if (call == CallState.connected) {
      muted = !muted;
      _emit();
    }
  }

  void dtmf(String digit) {
    if (call == CallState.connected) {
      digits += digit;
      _emit();
    }
  }

  void end({bool reject = false}) {
    if (call == CallState.idle) return;
    _finish(
      reject
          ? 'rejected'
          : call == CallState.connected
          ? 'completed'
          : 'cancelled',
    );
    _emit();
  }

  void _finish(String status) {
    calls.insert(0, {'peer': peer, 'status': status, 'line': selectedLine});
    call = CallState.idle;
    muted = false;
    digits = '';
  }

  void networkError([String reason = 'Simulated SDK connection failure']) {
    _heartbeat?.cancel();
    ready = false;
    connection = 'SDK offline';
    error = reason;
    if (call != CallState.idle) _finish('interrupted');
    _emit();
  }

  Future<void> renew() async {
    if (!registered) return;
    final epoch = _epoch;
    ready = false;
    _heartbeat?.cancel();
    connection = 'Renewing voice token';
    _emit();
    try {
      final result = await api.register(deviceId, 'ios');
      if (_disposed || epoch != _epoch) {
        await api.unregister(deviceId);
        return;
      }
      if (result['voiceAvailable'] != true) {
        throw StateError('Voice unavailable');
      }
      connection = 'Renewed — awaiting SDK registration';
    } catch (e) {
      if (epoch == _epoch) networkError('$e');
    }
    _emit();
  }

  Future<void> send(String to, String text) async {
    if (sending) return;
    sending = true;
    error = null;
    _emit();
    try {
      final result = await api.sendSms(selectedLine, to, text);
      messages.insert(0, {
        'id': result['sk'],
        ...result['data'] as Map<String, dynamic>,
      });
    } catch (e) {
      error = '$e';
    } finally {
      sending = false;
      _emit();
    }
  }

  void messageStatus(Map<String, dynamic> message, String status) {
    message['status'] = status;
    _emit();
  }

  @override
  void dispose() {
    _disposed = true;
    unawaited(disconnect());
    super.dispose();
  }
}
