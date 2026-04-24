'use client';

import { useEffect, useState } from 'react';
import { RsvpButton } from '@/components/RsvpButton';
import { ShareButton } from '@/components/ShareButton';

export function MeetupBottomBar({
  eventId,
  title,
  isLoggedIn,
  isFull,
  isPast,
  existingStatus,
  contactLink,
}: {
  eventId: string;
  title: string;
  isLoggedIn: boolean;
  isFull: boolean;
  isPast: boolean;
  existingStatus: string | null;
  contactLink: string | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const nearBottom = window.scrollY + window.innerHeight > document.body.scrollHeight - 240;
      setVisible(nearBottom);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      padding: '14px 24px calc(24px + env(safe-area-inset-bottom, 0px))',
      background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(45,24,16,.1)',
      opacity: visible ? 1 : 0,
      visibility: visible ? 'visible' : 'hidden',
      // visibility delays to 'hidden' AFTER the opacity transition ends, so buttons stay tappable during fade-in
      transition: visible ? 'opacity .25s ease' : 'opacity .25s ease, visibility 0s linear .25s',
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          {isPast ? (
            <div style={{
              padding: '14px 20px', borderRadius: 999, textAlign: 'center',
              background: 'rgba(45,24,16,.05)', border: '1px solid rgba(45,24,16,.1)',
              color: 'rgba(45,24,16,.4)', fontWeight: 700, fontSize: 14,
            }}>
              This meetup has ended
            </div>
          ) : (
            <RsvpButton
              eventId={eventId}
              isLoggedIn={isLoggedIn}
              isFull={isFull}
              existingStatus={existingStatus}
            />
          )}
        </div>
        {existingStatus === 'approved' && contactLink && (
          <a
            href={contactLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block', padding: '12px 18px', borderRadius: 999,
              background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', whiteSpace: 'nowrap',
              boxShadow: '0 3px 10px rgba(255,107,91,.25)',
            }}
          >
            DM
          </a>
        )}
        <ShareButton title={title} />
      </div>
    </div>
  );
}
