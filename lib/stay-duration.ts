// Formats a user's "how long in Korea" line based on status + arrival/departure dates.
// Pure functions — no DOM, no fetch, safe to import anywhere.

export type StayFormat = {
  primary: string;
  secondary?: string;
  emphasis?: 'default' | 'upcoming' | 'past';
};

type DateLike = string | Date | null | undefined;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toDate(v: DateLike): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  // Accept 'YYYY-MM-DD' and 'YYYY-MM' (month picker). Force UTC midnight so TZ doesn't shift day.
  const m = typeof v === 'string' ? v.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/) : null;
  if (!m) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = m[3] ? Number(m[3]) : 1;
  return new Date(Date.UTC(year, month, day));
}

function dayDiff(from: Date, to: Date): number {
  const msPerDay = 86_400_000;
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / msPerDay);
}

function monthDiff(from: Date, to: Date): number {
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

function formatDuration(months: number): string {
  if (months < 1) return 'less than 1mo';
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem}mo`;
  if (rem === 0) return `${years}y`;
  return `${years}y ${rem}mo`;
}

function formatMonthYear(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatShortDate(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatAgo(months: number): string {
  if (months < 1) return 'recently';
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1y ago' : `${years}y ago`;
}

function formatIn(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 30) return `in ${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? 'in 1mo' : `in ${months}mo`;
}

export function formatStay(
  status: string | null | undefined,
  arrived: DateLike,
  departed: DateLike,
  now: Date = new Date(),
): StayFormat | null {
  if (!status || status === 'local') return null;

  const a = toDate(arrived);
  const d = toDate(departed);

  if (status === 'expat' || status === 'worker') {
    if (!a) return null;
    // Pre-arrival: 미래 날짜면 "Arriving {Month Year}" 코랄 강조
    if (a.getTime() > now.getTime()) {
      const days = dayDiff(now, a);
      return {
        primary: days < 60 ? `Arriving ${formatIn(days)}` : `Arriving ${formatMonthYear(a)}`,
        secondary: formatMonthYear(a),
        emphasis: 'upcoming',
      };
    }
    const months = monthDiff(a, now);
    const label = status === 'worker' ? 'working in Korea' : 'in Korea';
    const sincePrefix = status === 'worker' ? 'Started' : 'Since';
    const secondary = d
      ? `${formatMonthYear(a)} – ${formatMonthYear(d)}`
      : `${sincePrefix} ${formatMonthYear(a)}`;
    return {
      primary: `${formatDuration(months)} ${label}`,
      secondary,
    };
  }

  if (status === 'visiting_soon') {
    if (!a) return null;
    const days = dayDiff(now, a);
    if (days < 0) {
      // Arrived already but status stuck — fall through
      return { primary: `Arrived ${Math.abs(days)}d ago`, emphasis: 'default' };
    }
    return {
      primary: `Arriving ${formatIn(days)}`,
      secondary: formatShortDate(a),
      emphasis: 'upcoming',
    };
  }

  if (status === 'visitor' || status === 'exchange_student') {
    if (!a) return null;
    const isStudent = status === 'exchange_student';
    const dayWord = isStudent ? 'Day' : 'Day';
    const pastPrefix = isStudent ? 'Semester' : '';
    const fromNow = dayDiff(now, a);
    if (fromNow > 0) {
      // Trip / semester not started yet
      return {
        primary: `${isStudent ? 'Starting' : 'Arriving'} ${formatIn(fromNow)}`,
        secondary: d ? `${formatShortDate(a)} – ${formatShortDate(d)}` : formatShortDate(a),
        emphasis: 'upcoming',
      };
    }
    if (d) {
      const total = dayDiff(a, d) + 1; // inclusive
      const tillEnd = dayDiff(now, d);
      if (tillEnd < 0) {
        return {
          primary: isStudent
            ? `${pastPrefix} ended — ${total} days (${formatShortDate(a)} – ${formatShortDate(d)})`
            : `${total} days (${formatShortDate(a)} – ${formatShortDate(d)})`,
          emphasis: 'past',
        };
      }
      const current = Math.min(total, dayDiff(a, now) + 1);
      return {
        primary: `${dayWord} ${current} of ${total}${isStudent ? ' (semester)' : ''}`,
        secondary: `${formatShortDate(a)} – ${formatShortDate(d)}`,
      };
    }
    const daysIn = dayDiff(a, now) + 1;
    return { primary: `Day ${daysIn}`, secondary: `Since ${formatShortDate(a)}` };
  }

  if (status === 'visited_before') {
    if (!a) return null;
    const monthsSinceDeparture = d ? monthDiff(d, now) : monthDiff(a, now);
    const total = d ? dayDiff(a, d) + 1 : null;
    return {
      primary: total ? `Visited ${formatAgo(monthsSinceDeparture)} (${total} days)` : `Visited ${formatAgo(monthsSinceDeparture)}`,
      secondary: d ? `${formatShortDate(a)} – ${formatShortDate(d)}` : undefined,
      emphasis: 'past',
    };
  }

  return null;
}
