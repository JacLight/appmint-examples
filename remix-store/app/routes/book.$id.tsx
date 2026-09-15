import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, Link, useLoaderData, useNavigation, useActionData, useSearchParams } from '@remix-run/react';
import { appmint, AppmintError } from '~/appmint.server';
import { atBusiness, todayAt, type Paged, type ReservationDefinition, type SlotsResponse } from '~/types';

/**
 * Pick a day, pick a slot, book it.
 *
 * Two server calls live here, and neither one is reachable from the browser:
 *
 *   loader  → crm/reservations/definitions  (what is this service?)
 *           → crm/reservations/slots        (what is free on that day?)
 *   action  → crm/reservations/create       (take it)
 *
 * The day is a URL search param, which means the loader re-runs when it
 * changes and availability is never stale state sitting in a component.
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id!;
  const url = new URL(request.url);

  // There is no "get one definition" endpoint — the list is the read surface,
  // and it is cheap. Find ours in it.
  const page = await appmint<Paged<ReservationDefinition>>('GET', 'crm/reservations/definitions');
  const row = (page?.data ?? []).find((r) => r.sk === id);
  if (!row) throw new Response('Not found', { status: 404 });

  const definition = row.data;
  const tz = definition.officeHours?.timezone || 'UTC';
  const date = url.searchParams.get('date') || todayAt(tz);
  const serviceName = url.searchParams.get('service') || definition.services?.[0]?.name;

  // Availability is the server's answer, not a calculation over office hours.
  // It already knows about blocked time, grace periods and everyone else's
  // bookings — three things a client cannot see.
  let slots: SlotsResponse['slots'] = [];
  let slotError: string | null = null;
  try {
    const res = await appmint<SlotsResponse>('POST', 'crm/reservations/slots', {
      reservationDefinitionId: id,
      serviceDate: date,
      serviceName,
    });
    slots = res.slots ?? [];
  } catch (e) {
    // A closed day comes back as a 400 with a sentence meant for a human
    // ("We are closed on this day. Please select Monday,Tuesday…"). Show it.
    slotError = (e as Error).message;
  }

  return json({ id, definition, tz, date, serviceName, slots, slotError });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = String(form.get('email') || '').trim();

  try {
    // A guest booking: no customer account, no login. AppEngine finds or
    // creates the customer record from these contact details, so the booking
    // still belongs to somebody.
    const created = await appmint<{ name?: string }>('POST', 'crm/reservations/create', {
      reservationDefinitionId: params.id,
      service: form.get('service') || undefined,
      startTime: form.get('startTime'),
      endTime: form.get('endTime'),
      customer: {
        email,
        name: String(form.get('name') || '').trim(),
        phone: String(form.get('phone') || '').trim() || undefined,
      },
      note: String(form.get('note') || '').trim() || undefined,
    });

    // The reservation NUMBER is the record's `name` — that plus the email is
    // what a guest later uses to find or cancel the booking.
    const params_ = new URLSearchParams({ email });
    if (created?.name) params_.set('number', created.name);
    return redirect(`/bookings?${params_}&booked=1`);
  } catch (e) {
    const message = e instanceof AppmintError ? e.message : (e as Error).message;
    return json({ error: message }, { status: 400 });
  }
}

export default function BookService() {
  const { definition, tz, date, serviceName, slots, slotError } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const chosen = searchParams.get('slot');

  const slot = slots.find((s) => s.startTime === chosen);
  const busy = navigation.state !== 'idle';

  return (
    <>
      <p className="crumb"><Link to="/book">← All services</Link></p>
      <h1>{definition.title || definition.name}</h1>
      {definition.description && <p className="lede">{definition.description}</p>}

      <p className="muted">
        {definition.workDays?.length ? `Open ${definition.workDays.join(', ')}. ` : ''}
        {definition.officeHours?.startTime
          ? `${definition.officeHours.startTime}–${definition.officeHours.endTime} ${tz}.`
          : ''}
      </p>

      {/* Changing the date is a GET: the loader re-runs, new availability
          arrives, and the URL is shareable. No fetch call in sight. */}
      <Form method="get" className="row" style={{ margin: '1.5rem 0' }}>
        <label htmlFor="date">Date</label>
        <input type="date" id="date" name="date" defaultValue={date} min={todayAt(tz)} />
        {serviceName && <input type="hidden" name="service" value={serviceName} />}
        <button type="submit">Check availability</button>
      </Form>

      {slotError && <p className="note">{slotError}</p>}

      {!slotError && !chosen && (
        <>
          <h2>Available times <span className="muted">({tz})</span></h2>
          {slots.length === 0 ? (
            <p className="muted">Nothing free on this date. Try another day.</p>
          ) : (
            <div className="slots">
              {slots.map((s) => (
                <Link
                  key={s.startTime}
                  to={`?date=${date}${serviceName ? `&service=${encodeURIComponent(serviceName)}` : ''}&slot=${encodeURIComponent(s.startTime)}`}
                  className="slot"
                  aria-disabled={s.spotsAvailable < 1}
                >
                  {atBusiness(s.startTime, s.businessTimezone)}
                  {s.spotsAvailable > 1 && <em>{s.spotsAvailable} spots</em>}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {slot && (
        <>
          <h2>Confirm</h2>
          <p className="lede">
            {atBusiness(slot.startTime, slot.businessTimezone, {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
            {' · '}
            {atBusiness(slot.startTime, slot.businessTimezone)}–{atBusiness(slot.endTime, slot.businessTimezone)}
            {' '}
            <span className="muted">({slot.businessTimezone})</span>
          </p>

          <Form method="post" className="stack" style={{ maxWidth: '28rem' }}>
            {/* The exact instants the server offered go back unchanged. The
                client never re-derives an end time from a duration. */}
            <input type="hidden" name="startTime" value={slot.startTime} />
            <input type="hidden" name="endTime" value={slot.endTime} />
            {serviceName && <input type="hidden" name="service" value={serviceName} />}

            <label>Name<input name="name" required autoComplete="name" /></label>
            <label>Email<input name="email" type="email" required autoComplete="email" /></label>
            <label>Phone <span className="muted">(optional)</span><input name="phone" autoComplete="tel" /></label>
            <label>Anything we should know?<textarea name="note" rows={3} /></label>

            {actionData && 'error' in actionData && <p className="note">{actionData.error}</p>}

            <div className="row">
              <button type="submit" disabled={busy}>{busy ? 'Booking…' : 'Book this time'}</button>
              <Link to={`?date=${date}`} className="linkish">Pick another time</Link>
            </div>
          </Form>
        </>
      )}
    </>
  );
}
