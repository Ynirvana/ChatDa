'use client';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// "7:00 PM" | "19:00" -> { h: 19, m: 0 }
function parseTime(t: string): { h: number; m: number } {
  const ampm = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const suffix = ampm[3].toUpperCase();
    if (suffix === 'PM' && h !== 12) h += 12;
    if (suffix === 'AM' && h === 12) h = 0;
    return { h, m };
  }
  const [h, m] = t.split(':').map(x => parseInt(x, 10));
  return { h: h || 0, m: m || 0 };
}

// ICS UTC datetime format: YYYYMMDDTHHMMSSZ — we treat event time as KST (+09:00)
function toIcsUtc(date: string, time: string, offsetMinutes = 0): string {
  const [y, mo, d] = date.split('-').map(x => parseInt(x, 10));
  const { h, m } = parseTime(time);
  // Event is in KST, convert to UTC: KST = UTC+9
  const kstDate = new Date(Date.UTC(y, mo - 1, d, h, m));
  // Subtract 9 hours to get UTC
  kstDate.setUTCMinutes(kstDate.getUTCMinutes() - 9 * 60 + offsetMinutes);
  return `${kstDate.getUTCFullYear()}${pad(kstDate.getUTCMonth() + 1)}${pad(kstDate.getUTCDate())}T${pad(kstDate.getUTCHours())}${pad(kstDate.getUTCMinutes())}00Z`;
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function AddToCalendarButton({
  eventId,
  title,
  date,
  time,
  endTime,
  location,
  description,
}: {
  eventId: string;
  title: string;
  date: string;       // YYYY-MM-DD
  time: string;       // start
  endTime?: string | null;
  location: string;
  description?: string | null;
}) {
  const handleClick = () => {
    const start = toIcsUtc(date, time);
    // If no end time, default to 2 hours after start
    const end = endTime
      ? toIcsUtc(date, endTime)
      : toIcsUtc(date, time, 120);
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    const url = typeof window !== 'undefined' ? `${window.location.origin}/meetups/${eventId}` : '';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ChatDa//Meetups//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${eventId}@chatda`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${icsEscape(title)}`,
      `LOCATION:${icsEscape(location)}`,
      `DESCRIPTION:${icsEscape((description ?? '') + (url ? `\n\nDetails: ${url}` : ''))}`,
      url ? `URL:${url}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${title.replace(/[^\w\s-]/g, '').trim() || 'event'}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <button
      onClick={handleClick}
      title="Add to calendar"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.1)',
        cursor: 'pointer', color: 'rgba(255,255,255,.7)',
        flexShrink: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="12" y1="14" x2="12" y2="18"/>
        <line x1="10" y1="16" x2="14" y2="16"/>
      </svg>
    </button>
  );
}
