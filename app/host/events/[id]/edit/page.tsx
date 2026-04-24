import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { Nav } from '@/components/ui/Nav';
import { Orb } from '@/components/ui/Card';
import { CreateEventForm, type EventFormInitial } from '@/components/host/CreateEventForm';
import { backendFetch, type ApiEventDetail } from '@/lib/server-api';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  let event: ApiEventDetail;
  try {
    event = await backendFetch<ApiEventDetail>(`/events/${id}`);
  } catch {
    notFound();
  }

  if (!event.host || event.host.id !== session.user.id) {
    redirect(`/meetups/${id}`);
  }

  const initial: EventFormInitial = {
    title: event.title,
    date: event.date,
    time: event.time,
    endTime: event.end_time,
    location: event.location,
    area: event.area,
    capacity: event.capacity,
    fee: event.fee,
    description: event.description,
    coverImage: event.cover_image,
    googleMapUrl: event.google_map_url,
    naverMapUrl: event.naver_map_url,
    directions: event.directions,
    paymentMethod: event.payment_method,
    feeNote: event.fee_note,
    contactLink: event.contact_link,
    requirements: event.requirements,
  };

  return (
    <div className="page-bg-light" style={{ minHeight: '100vh' }}>
      <Nav user={session.user} isAdmin={isAdminEmail(session.user.email)} light />
      <Orb size={400} color="rgba(255, 140, 120, .15)" top={-50} right={-100} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>
        <Link href={`/meetups/${id}`} style={{ fontSize: 14, color: 'rgba(45,24,16,.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
          ← Back to meetup
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 4, color: '#2D1810' }}>Edit Meetup</h1>
        <p style={{ fontSize: 14, color: 'rgba(45,24,16,.5)', marginBottom: 28 }}>
          Update details for &quot;{event.title}&quot;
        </p>

        <CreateEventForm eventId={id} initial={initial} />
      </div>
    </div>
  );
}
