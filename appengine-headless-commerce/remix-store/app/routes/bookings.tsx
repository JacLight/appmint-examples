import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, Link, useLoaderData, useNavigation } from '@remix-run/react';
import { appmint, AppmintError } from '~/appmint.server';
import { atBusiness, type BaseModel, type Paged, type Reservation } from '~/types';

/**
 * Manage a booking without an account.
 *
 * `crm/reservations/by-email/:email` is public, and that is deliberate: the
 * email IS the credential for a guest booking. Anyone who knows the address
 * can see its reservations, which is the same trade every "manage your
 * booking" link in your inbox makes. If that is too loose for your business,
 * sign the customer in and pass their token — the endpoint honours it.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email')?.trim() ?? '';
  const number = url.searchParams.get('number')?.trim() ?? '';
  const justBooked = url.searchParams.get('booked') === '1';

  const empty: BaseModel<Reservation>[] = [];
  if (!email) return json({ email, number, justBooked, searched: false, reservations: empty, error: null as string | null });

  const path = number
    ? `crm/reservations/by-email/${encodeURIComponent(email)}/${encodeURIComponent(number)}`
    : `crm/reservations/by-email/${encodeURIComponent(email)}`;

  try {
    const page = await appmint<Paged<Reservation>>('GET', path);
    return json({ email, number, justBooked, searched: true, reservations: page?.data ?? empty, error: null });
  } catch (e) {
    return json({ email, number, justBooked, searched: true, reservations: empty, error: (e as Error).message });
  }
}

/**
 * Cancelling is a DELETE keyed by email + reservation number — the same two
 * facts that let you see the booking let you release it. The server decides
 * what cancelling means (freeing the slot, sending the notice); this just
 * asks for it.
 */
export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = String(form.get('email') || '');
  const number = String(form.get('number') || '');

  try {
    await appmint('DELETE', `crm/reservations/cancel/${encodeURIComponent(email)}/${encodeURIComponent(number)}`);
  } catch (e) {
    const message = e instanceof AppmintError ? e.message : (e as Error).message;
    return json({ error: message }, { status: 400 });
  }
  // Land back on the list so the visitor sees the new state, not a message
  // claiming it.
  return redirect(`/bookings?email=${encodeURIComponent(email)}`);
}

const CANCELLED = new Set(['cancelled', 'canceled', 'no-show', 'noshow']);

export default function Bookings() {
  const { email, number, justBooked, searched, reservations, error } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <>
      <h1>Your bookings</h1>

      {justBooked && <p className="ok">Booked. Keep the reservation number below — it is how you find or cancel this later.</p>}

      <Form method="get" className="row" style={{ margin: '1.5rem 0' }}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" defaultValue={email} required placeholder="you@example.com" />
        <label htmlFor="number">Number <span className="muted">(optional)</span></label>
        <input id="number" name="number" defaultValue={number} placeholder="C0503UNL" />
        <button type="submit">Find</button>
      </Form>

      {error && <p className="note">{error}</p>}

      {searched && reservations.length === 0 && !error && <p className="muted">No reservations for {email}.</p>}

      <div className="stack">
        {reservations.map((row) => {
          const r = row.data;
          const cancelled = CANCELLED.has(String(r.status || '').toLowerCase());

          return (
            <article key={row.sk} className={`booking${cancelled ? ' is-cancelled' : ''}`}>
              <header>
                <strong>{r.service || 'Appointment'}</strong>
                <span className="status">{r.status}</span>
              </header>

              <p>
                {atBusiness(r.startTime, r.timezone, { weekday: 'long', month: 'long', day: 'numeric' })}
                {' · '}
                {atBusiness(r.startTime, r.timezone)}–{atBusiness(r.endTime, r.timezone)}
                {' '}
                <span className="muted">({r.timezone})</span>
              </p>

              <p className="sku">Reservation {r.name}</p>
              {r.note && <p className="muted">{r.note}</p>}
              {r.meetingLink && !cancelled && (
                <p><a href={r.meetingLink} target="_blank" rel="noreferrer">Join the meeting</a></p>
              )}

              {!cancelled && (
                <Form method="post">
                  <input type="hidden" name="email" value={r.customer?.email || email} />
                  <input type="hidden" name="number" value={r.name} />
                  <button type="submit" className="danger" disabled={navigation.state !== 'idle'}>
                    Cancel this booking
                  </button>
                </Form>
              )}
            </article>
          );
        })}
      </div>

      <p className="muted" style={{ marginTop: '2rem' }}>
        Need a new time? <Link to="/book">Book an appointment</Link>.
      </p>
    </>
  );
}
