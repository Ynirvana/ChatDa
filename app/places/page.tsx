import Link from 'next/link';
import { Nav } from '@/components/ui/Nav';
import { Card, Orb } from '@/components/ui/Card';

const MOCK_SPOTS = [
  { id: '1', name: '맛찬들왕소금구이', area: 'Hongdae', cat: 'food', emoji: '🥩', grad: 'linear-gradient(135deg,#e17055,#d63031)', photos: 4 },
  { id: '2', name: '펀마이마이', area: 'Itaewon', cat: 'bar', emoji: '🍺', grad: 'linear-gradient(135deg,#0984e3,#6c5ce7)', photos: 2 },
  { id: '3', name: 'Café Onion 안국', area: 'Jongno', cat: 'cafe', emoji: '☕', grad: 'linear-gradient(135deg,#fdcb6e,#e17055)', photos: 3 },
  { id: '4', name: '경복궁 Gyeongbokgung', area: 'Jongno', cat: 'culture', emoji: '🏛️', grad: 'linear-gradient(135deg,#00b894,#00cec9)', photos: 2 },
  { id: '5', name: '통인시장 Tongin Market', area: 'Jongno', cat: 'food', emoji: '🍱', grad: 'linear-gradient(135deg,#e84393,#fd79a8)', photos: 2 },
];

const CATS = [
  { key: 'all', label: 'All', icon: '✨' },
  { key: 'food', label: 'Restaurants', icon: '🍖' },
  { key: 'cafe', label: 'Cafés', icon: '☕' },
  { key: 'bar', label: 'Bars', icon: '🍺' },
  { key: 'culture', label: 'Culture', icon: '🏛️' },
];

export default function PlacesPage() {
  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <Nav />

      <Orb size={400} color="rgba(0,184,148,.2)" top={-50} right={-100} />
      <Orb size={300} color="rgba(232,67,147,.2)" top={400} left={-80} delay={1.5} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>Places</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', marginBottom: 20 }}>
          Discovered by foreigners. Shared for everyone.
        </p>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {CATS.map((c) => (
            <button key={c.key} style={{
              padding: '8px 18px', borderRadius: 999,
              border: '1.5px solid',
              borderColor: c.key === 'all' ? '#E84393' : 'rgba(255,255,255,.12)',
              background: c.key === 'all' ? 'rgba(232,67,147,.2)' : 'rgba(255,255,255,.08)',
              color: c.key === 'all' ? '#E84393' : 'rgba(255,255,255,.7)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Spot grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {MOCK_SPOTS.map((spot) => (
            <Link key={spot.id} href={`/places/${spot.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                height: 120, background: spot.grad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 48, position: 'relative',
              }}>
                {spot.emoji}
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  padding: '3px 10px', borderRadius: 999,
                  background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)',
                  fontSize: 11, fontWeight: 700,
                }}>
                  📸 {spot.photos}
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{spot.name}</h3>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', display: 'flex', gap: 10 }}>
                  <span>📍 {spot.area}</span>
                </div>
              </div>
            </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
