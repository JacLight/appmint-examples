/** Inject Twilio Device from your browser bundle. The complete lifecycle helper. */
export function persistentDeviceId(storage = localStorage) {
  let id = storage.getItem('appmint-phone-device');
  if (!id) {
    id = crypto.randomUUID();
    storage.setItem('appmint-phone-device', id);
  }
  return id;
}

export async function startSoftphone({api, Device, deviceId, label = 'Browser', onState = () => {}, onIncoming = () => {}, timers = globalThis}) {
  let current = await api.register({deviceId, platform: 'web', label, capabilities: ['voice', 'sms']});
  if (!current.voiceAvailable || !current.token) {
    onState({state: 'unavailable', reason: current.reason});
    return {available: false, registration: current};
  }
  const device = new Device(current.token);
  let ready = false, sdkRegistered = false, stopped = false, heartbeat;
  const state = value => onState({state: value, identity: current.identity, outboundReady: current.outboundReady});
  const stopHeartbeat = () => {
    if (heartbeat !== undefined) {
      timers.clearInterval(heartbeat);
      heartbeat = undefined;
    }
  };
  const startHeartbeat = () => {
    stopHeartbeat();
    if (stopped || !ready) return;
    heartbeat = timers.setInterval(async () => {
      if (stopped || !ready) return;
      try {
        const result = await api.heartbeat(deviceId);
        if (!result.ok) throw Error('Presence was not refreshed');
      } catch (error) {
        onState({state: 'presence-uncertain', reason: error.message});
      }
    }, 60000);
  };
  const observe = call => {
    call.on('accept', () => state('connected'));
    for (const name of ['disconnect', 'cancel', 'reject']) {
      call.on(name, () => state('ended'));
    }
    call.on('error', error => onState({state: 'error', reason: error.message}));
    return call;
  };
  device.on('registered', () => {
    if (stopped) return;
    sdkRegistered = true;
    ready = true;
    startHeartbeat();
    state('ready');
  });
  device.on('unregistered', () => {
    sdkRegistered = false;
    ready = false;
    stopHeartbeat();
    state('offline');
  });
  device.on('error', error => {
    sdkRegistered = false;
    ready = false;
    stopHeartbeat();
    onState({state: 'error', reason: error.message});
  });
  device.on('incoming', call => {
    observe(call);
    state('ringing');
    onIncoming({
      from: call.parameters.From,
      accept: () => call.accept(),
      reject: () => call.reject(),
      hangUp: () => call.disconnect(),
      mute: on => call.mute(on),
      sendDigits: digits => call.sendDigits(digits),
    });
  });
  device.on('tokenWillExpire', async () => {
    try {
      const next = await api.register({deviceId, platform: 'web', label, capabilities: ['voice', 'sms']});
      if (stopped) {
        await api.unregister(deviceId).catch(() => {});
        return;
      }
      if (!next.voiceAvailable || !next.token) throw Error(next.reason || 'Voice token unavailable');
      current = next;
      device.updateToken(next.token);
      if (sdkRegistered) {
        ready = true;
        startHeartbeat();
        state('ready');
      }
    } catch (error) {
      ready = false;
      stopHeartbeat();
      onState({state: 'renewal-failed', reason: error.message});
    }
  });
  try {
    await device.register();
  } catch (error) {
    device.destroy();
    await api.unregister(deviceId).catch(() => {});
    throw error;
  }
  return {
    available: true,
    get registration() { return current; },
    async call(to, from) {
      if (!ready || !current.outboundReady) throw Error('Wait for registered device and enabled outbound calling');
      if (!current.assignedPhones.some(p => p.phoneNumber === from)) throw Error('Select an assigned caller ID');
      state('dialing');
      const call = observe(await device.connect({params: {To: to, phone: to, CallerIdOverride: from}}));
      if (call.status?.() === 'open') state('connected');
      return {
        hangUp: () => call.disconnect(),
        mute: on => call.mute(on),
        sendDigits: digits => call.sendDigits(digits),
      };
    },
    async stop() {
      if (stopped) return;
      stopped = true;
      ready = false;
      stopHeartbeat();
      device.destroy();
      return api.unregister(deviceId);
    },
  };
}
