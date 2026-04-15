export interface Attendee {
  id: string;
  name: string;
  nationality: string | null;
  bio: string | null;
  profileImage: string | null;
  socialLinks: { platform: string; url: string }[];
}

const platformIcon: Record<string, string> = {
  linkedin: '💼',
  instagram: '📸',
  x: '𝕏',
  tiktok: '🎵',
};

export function AttendeeCard({ attendee }: { attendee: Attendee }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: 16,
      background: 'rgba(255,255,255,.06)',
      border: '1px solid rgba(255,255,255,.1)',
      borderRadius: 14,
    }}>
      {attendee.profileImage ? (
        <img
          src={attendee.profileImage}
          alt=""
          style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #FF6B35, #E84393)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 800, color: '#fff',
        }}>
          {attendee.name[0]}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{attendee.name}</span>
          {attendee.nationality && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{attendee.nationality}</span>
          )}
        </div>

        {attendee.bio && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 8, lineHeight: 1.4 }}>
            {attendee.bio}
          </p>
        )}

        {attendee.socialLinks.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            {attendee.socialLinks.map(link => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {platformIcon[link.platform] ?? '🔗'} {link.platform}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
