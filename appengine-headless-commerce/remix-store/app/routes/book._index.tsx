import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { appmint } from '~/appmint.server';
import type { Paged, ReservationDefinition } from '~/types';

/**
 * What can be booked here.
 *
 * `crm/reservations/definitions` is a public endpoint — no customer token is
 * needed to see what a business offers, exactly as no token is needed to see
 * its catalog. The definitions come back as stored records, so the fields you
 * want are under `.data` and the id you need later is `.sk`.
 */
export async function loader() {
  try {
    // Reads come back paged: `data` holds the records, the rest describes the
    // page. Reach for `.data`, not the envelope.
    const page = await appmint<Paged<ReservationDefinition>>('GET', 'crm/reservations/definitions');
    const active = (page?.data ?? []).filter((r) => r.data?.status !== 'inactive');
    return json({ definitions: active, error: null as string | null });
  } catch (e) {
    return json({ definitions: [], error: (e as Error).message });
  }
}

export default function BookIndex() {
  const { definitions, error } = useLoaderData<typeof loader>();

  if (error) {
    return (
      <>
        <h1>Book an appointment</h1>
        <p className="note">Could not reach appengine: {error}</p>
      </>
    );
  }

  return (
    <>
      <h1>Book an appointment</h1>
      <p className="lede">
        {definitions.length} bookable {definitions.length === 1 ? 'service' : 'services'}, from{' '}
        <code>crm/reservations/definitions</code>.
      </p>

      <div className="grid">
        {definitions.map((row) => {
          const d = row.data;
          const img = typeof d.image === 'string' ? d.image : d.image?.url;
          const service = d.services?.[0];

          return (
            <Link key={row.sk} to={`/book/${row.sk}`} className="card">
              {img ? <img src={img} alt={d.title || d.name} /> : null}
              <span className="name">{d.title || d.name}</span>
              <span className="sku">
                {service?.duration ? `${service.duration} min` : 'Appointment'}
                {d.venue ? ` · ${d.venue}` : ''}
              </span>
              <span className="price">
                {/* The definition says whether money is involved. Don't assume. */}
                {d.paymentRequired && service?.price ? `$${service.price}` : 'Free to book'}
              </span>
            </Link>
          );
        })}
      </div>

      {definitions.length === 0 && (
        <p className="muted">This organization has no reservation definitions yet.</p>
      )}

      <p className="muted" style={{ marginTop: '2rem' }}>
        Already booked? <Link to="/bookings">Look up your reservation</Link>.
      </p>
    </>
  );
}
