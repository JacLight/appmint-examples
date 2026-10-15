# Current Appmint Mobile source excerpts

Source: `appmint_go/appmint_mobile/lib/screens/phone/phone_screen.dart`. SHA256 `b18d87519fbeb92ad6cd33be09e919a3160abcba7f5d0e411258cfe1ccc1d07f`. Captured 14 October 2026. These are selected excerpts, not a standalone compilation unit. Retain the original app context when following its symbols; see [integration prerequisites](README.md).

## Source lines 313–345

```dart
      return;
    }

    try {
      if (kDebugMode) debugPrint('📞 Placing call from $fromNumber to $_phoneNumber');
      // Twilio OVERWRITES the `From` param with the Device's configured
      // callerId, so passing it via `from:` alone has no effect on what
      // the recipient sees. The appengine voice webhook reads the user's
      // selected caller id from a custom `CallerIdOverride` param instead
      // (validated against the user's assigned phones). See
      // appengine/src/connect/vendor/twilio.connect.ts:476.
      final ok = await TwilioVoicePlatform.instance.call.place(
        from: fromNumber,
        to: _phoneNumber,
        extraOptions: {'CallerIdOverride': fromNumber},
      );
      if (ok != true) {
        // All preconditions passed but place() still returned false —
        // fall back to "Open Settings" since the most common remaining
        // cause is the phone account being disabled by the user.
        throw Exception(
          'Call could not be placed. The Android telecom system rejected it — most often because Appmint Mobile is not toggled on under Settings → Default apps → Calling accounts.',
        );
      }
      if (!mounted) return;
      setState(() => _isInitializing = false);
      _maybeShowInCall();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isCalling = false;
        _isInitializing = false;
        _initError = e.toString().replaceFirst('Exception: ', '');
```

## Source lines 391–410

```dart
  void _onGlobalCallEvent(CallEvent event) {
    if (!mounted) return;
    switch (event) {
      case CallEvent.connected:
        _callActive = true;
        _maybeShowInCall();
        setState(() {});
        break;
      case CallEvent.callEnded:
      case CallEvent.declined:
        _callActive = false;
        _inCallShown = false;
        // Without this the dialer button stays red with a call-end icon after
        // the call is over, and there is nothing left to end.
        _isCalling = false;
        _isInitializing = false;
        setState(() {});
        break;
      default:
        break;
```

## Source lines 1109–1138

```dart
  void _listenToCallEvents() {
    _events = TwilioVoicePlatform.instance.callEventsListener.listen((event) {
      if (!mounted) return;
      switch (event) {
        case CallEvent.ringing:
          setState(() => _callState = 'ringing');
          break;
        case CallEvent.connected:
          _timer?.cancel();
          _timer = Timer.periodic(const Duration(seconds: 1), (t) {
            if (mounted) setState(() => _seconds = t.tick);
          });
          setState(() => _callState = 'connected');
          break;
        case CallEvent.callEnded:
          setState(() => _callState = 'disconnected');
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted) widget.onEnd();
          });
          break;
        case CallEvent.declined:
          setState(() => _callState = 'failed');
          break;
        default:
          break;
      }
    });
  }

  String get _statusText {
```

## Source lines 1205–1244

```dart
              children: [
                if (_callState == 'connected') ...[
                  GestureDetector(
                    onTap: () {
                      setState(() => _muted = !_muted);
                      TwilioVoicePlatform.instance.call.toggleMute(_muted);
                    },
                    child: Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(
                        color: _muted
                            ? HaHoColors.textLight
                            : HaHoColors.cardLight.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(_muted ? Icons.mic_off : Icons.mic,
                          color: _muted ? HaHoColors.cardDark : HaHoColors.textLight,
                          size: 24),
                    ),
                  ),
                  const SizedBox(width: HaHoSpacing.xxl),
                  GestureDetector(
                    onTap: () {
                      setState(() => _speakerOn = !_speakerOn);
                      TwilioVoicePlatform.instance.call.toggleSpeaker(_speakerOn);
                    },
                    child: Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(
                        color: _speakerOn
                            ? HaHoColors.textLight
                            : HaHoColors.cardLight.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(_speakerOn ? Icons.volume_up : Icons.volume_down,
                          color: _speakerOn ? HaHoColors.cardDark : HaHoColors.textLight,
                          size: 24),
                    ),
                  ),
                  const SizedBox(width: HaHoSpacing.xxl),
```
