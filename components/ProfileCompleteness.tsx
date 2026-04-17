import type { ApiProfile } from '@/lib/server-api';
import { computeCompleteness } from '@/lib/completeness';

export function ProfileCompleteness({ profile }: { profile: ApiProfile }) {
  const { percent, filled, total } = computeCompleteness(profile);
  if (total === 0) return null;

  const complete = percent >= 100;
  const barColor = complete
    ? 'linear-gradient(135deg, #00957A, #3E82CB)'
    : 'linear-gradient(135deg, #FF6B5B, #E84393)';

  return (
    <div style={{
      padding: 18,
      borderRadius: 16,
      background: '#FFFFFF',
      border: '1px solid rgba(45, 24, 16, .1)',
      marginBottom: 20,
      boxShadow: '0 2px 12px rgba(45, 24, 16, .05)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#3D2416', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Profile completeness
        </span>
        <span style={{
          fontSize: 18, fontWeight: 900,
          color: complete ? '#00957A' : '#FF6B5B',
        }}>
          {percent}%
        </span>
      </div>

      <div style={{
        height: 8, borderRadius: 999,
        background: 'rgba(45, 24, 16, .06)',
        overflow: 'hidden',
        marginBottom: 10,
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: barColor,
          transition: 'width .3s',
          boxShadow: complete ? 'none' : '0 0 10px rgba(255, 107, 91, .4)',
        }} />
      </div>

      <p style={{
        fontSize: 12,
        color: complete ? '#00957A' : 'rgba(45, 24, 16, .62)',
        fontWeight: complete ? 700 : 500,
      }}>
        {complete
          ? '✓ All set — you look great on the People tab.'
          : `${filled}/${total} sections filled. Complete your profile to get more connections.`}
      </p>
    </div>
  );
}
