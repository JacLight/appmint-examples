# Current Appmint Mobile source excerpts

Source: `appmint_go/appmint_mobile/lib/services/softphone_service.dart`. SHA256 `ee0fd1a50cfade4e1eee14a30d9c85b324074db1deafaab2ee6bfc01a3bb0c54`. Captured 14 October 2026. These are selected excerpts, not a standalone compilation unit. Retain the original app context when following its symbols; see [integration prerequisites](README.md).

## Source lines 96–147

```dart
    String? platform,
    String? label,
    List<String> capabilities = const ['voice', 'sms'],
    bool force = false,
  }) async {
    try {
      // "Go offline" (closed for business) must STICK: the app auto-registers on
      // login, token refresh, opening the dialer, etc. Unless this is an explicit
      // go-online (force), honor the persisted offline choice and stay off.
      if (!force && await isUserOffline()) {
        if (kDebugMode) debugPrint('📴 Softphone: user is offline — skipping registration');
        return null;
      }
      final id = await getOrCreateDeviceId();
      final resolvedPlatform = platform ?? _detectPlatform();
      if (kDebugMode) debugPrint('📞 Softphone: POST /phone/voice/register-device deviceId=$id platform=$resolvedPlatform caps=$capabilities');
      final response = await _http.post('/phone/voice/register-device', body: {
        'deviceId': id,
        'platform': resolvedPlatform,
        // iOS: the APNs environment this build is code-signed for, read from the
        // provisioning profile (App Store → production, dev → sandbox). Lets the
        // backend attach the matching Twilio Push Credential automatically — no
        // manual sandbox/prod flag flipping.
        if (resolvedPlatform == 'ios')
          'apnsEnvironment': await _apnsEnvironment(),
        if (label != null) 'label': label,
        'capabilities': capabilities,
        // Attach device/app telemetry — server mirrors web RequestInfo
        'clientInfo': await clientInfoService.withNetwork(),
      }).timeout(
        const Duration(seconds: 12),
        onTimeout: () {
          if (kDebugMode) {
            debugPrint('❌ Softphone: register-device timed out (backend '
                'unreachable?). Voice/SMS unavailable until next attempt; '
                'app startup not blocked.');
          }
          return null;
        },
      );

      if (response is! Map) {
        if (kDebugMode) debugPrint('❌ Softphone: unexpected register response: $response');
        return null;
      }

      final data = Map<String, dynamic>.from(response);
      _identity = data['identity']?.toString();
      _token = data['token']?.toString();
      expiresIn = (data['expiresIn'] is num) ? (data['expiresIn'] as num).toInt() : null;
      _capabilities = (data['capabilities'] is List)
          ? (data['capabilities'] as List).map((e) => e.toString()).toList()
```

## Source lines 203–238

```dart
          // token, so Twilio's Registrar stops routing this device under the
          // previous org's identity. Skipped on a same-org token refresh so an
          // active call isn't disturbed — setTokens updates the token in place.
          if (_nativeBoundOrg != currentOrg) {
            if (kDebugMode) {
              debugPrint('🔁 Softphone: voice org changed ($_nativeBoundOrg → $currentOrg) — '
                  'unbinding stale native Device before re-bind.');
            }
            try {
              await TwilioVoicePlatform.instance
                  .unregister()
                  .timeout(const Duration(seconds: 5), onTimeout: () => null);
            } catch (e) {
              if (kDebugMode) debugPrint('⚠️ Softphone: native unregister before re-bind failed (continuing): $e');
            }
          }

          final deviceToken = await _fetchDevicePushToken(platform: resolvedPlatform);
          // The twilio_voice 0.3.x iOS handler has a known issue where setTokens
          // never calls result() back to Dart if PushKit hasn't issued a VoIP
          // token yet. Wrap in a timeout so registration doesn't hang; the
          // accessToken is cached natively and the plugin's didUpdate callback
          // registers once PushKit issues a token.
          await TwilioVoicePlatform.instance
              .setTokens(
                accessToken: _token!,
                deviceToken: deviceToken,
              )
              .timeout(const Duration(seconds: 5), onTimeout: () {
                if (kDebugMode) {
                  debugPrint('⚠️ Softphone: TwilioVoice.setTokens did not return within 5s — '
                      'on iOS this usually means PushKit has not issued a VoIP token yet '
                      '(Xcode → Runner → Signing & Capabilities → Push Notifications must be added).');
                }
                return null;
              });
```

## Source lines 305–346

```dart
  /// Refresh the Twilio token. The Twilio SDK should call this when it fires
  /// `tokenWillExpire` (~3 minutes before expiry).
  Future<String?> refreshToken({String platform = 'android'}) async {
    final data = await registerDevice(platform: platform, capabilities: _capabilities.isEmpty ? const ['voice', 'sms'] : _capabilities);
    if (data != null && _token != null) {
      onTokenRefreshed?.call(_token!);
      return _token;
    }
    return null;
  }

  /// Unregister this device. Called on logout / app shutdown.
  ///
  /// Tears down BOTH the backend presence entry AND the native Twilio Voice
  /// registration. Dropping the native binding is essential for multi-tenant
  /// safety: without it the Device keeps ringing under the just-logged-out
  /// user/org's identity even after someone else signs in on the same install.
  Future<void> unregisterDevice() async {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;

    // Always drop the native binding first, regardless of backend state.
    await _unbindNativeVoice();

    if (_deviceId == null || !_registered) {
      _registered = false;
      return;
    }
    try {
      await _http.post('/phone/voice/unregister-device', body: {'deviceId': _deviceId});
    } catch (e) {
      if (kDebugMode) debugPrint('Softphone: unregister failed — $e');
    } finally {
      _registered = false;
      _token = null;
      _identity = null;
      _assignedPhones = const [];
    }
  }

  /// Whether the user chose "Go offline" (persisted). While true, the softphone
  /// stays unregistered and does not receive calls — even across app restarts.
```
