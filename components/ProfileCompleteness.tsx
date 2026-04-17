import type { ApiProfile } from '@/lib/server-api';
import { computeCompleteness } from '@/lib/completeness';

export function ProfileCompleteness({ profile }: { profile: ApiProfile }) {
  const { percent, filled, total } = computeCompleteness(profile);
  if (total === 0) return null;

  const complete = percent >= 100;
  const barColor = complete
    ? 'linear-gradient(135deg, #00B894, #74B9FF)'
    : 'linear-gradient(135deg, #FF6B35, #E84393)';

  return (
    <div style={{
      padding: 16,
      borderRadius: 14,
      background: 'rgba(255,255,255,.04)',
      border: '1px solid rgba(255,255,255,.08)',
      marginBottom: 20,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.7)' }}>
          Profile completeness
        </span>
        <span style={{
          fontSize: 16, fontWeight: 900,
          color: complete ? '#00B894' : '#FF6B35',
        }}>
          {percent}%
        </span>
      </div>

      <div style={{
        height: 6, borderRadius: 999,
        background: 'rgba(255,255,255,.08)',
        overflow: 'hidden',
        marginBottom: 8,
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: barColor,
          transition: 'width .3s',
        }} />
      </div>

      <p style={{
        fontSize: 12,
        color: complete ? '#00B894' : 'rgba(255,255,255,.4)',
        fontWeight: complete ? 700 : 500,
      }}>
        {complete
          ? '✓ All set — you look great on the People tab.'
          : `${filled}/${total} sections filled. Complete your profile to get more connections.`}
      </p>
    </div>
  );
}
