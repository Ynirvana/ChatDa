/** "19:00" → "7:00 PM", "7:00 PM" → "7:00 PM" */
export function formatTime(time: string): string {
  // Already in 12h format
  if (/[ap]m/i.test(time)) return time;

  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${suffix}`;
}
