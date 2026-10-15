/** Browser integration entry point. Inject your authenticated trusted-host API. */
import {startSoftphone, persistentDeviceId} from './browser-softphone.mjs';

export async function mountPhone({api, Device, ui}) {
  const phone = await startSoftphone({
    api,
    Device,
    deviceId: persistentDeviceId(),
    label: 'Support browser',
    onState: state => ui.showState(state),
    onIncoming: incoming => ui.offerCall({
      from: incoming.from,
      answer: incoming.accept,
      reject: incoming.reject,
      hangUp: incoming.hangUp,
      mute: incoming.mute,
    }),
  });
  if (!phone.available) return phone;

  ui.onDial(async ({to, from}) => {
    try {
      const call = await phone.call(to, from);
      ui.onHangup(() => call.hangUp());
      ui.onMute(muted => call.mute(muted));
    } catch (error) {
      ui.showError(error.message);
    }
  });
  ui.onLogout(() => phone.stop());
  return phone;
}

/** The send flag is a query option, not a field inside the message. */
export async function sendText(appmint, {from, to, text}) {
  return appmint.request(
    'POST', '/crm/inbox/update',
    {data: {deliveryType: 'sms', from, to: [to], text}},
    {send: true},
  );
}
