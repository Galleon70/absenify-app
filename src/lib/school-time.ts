// src/lib/school-time.ts
// Tanggal & jam menurut zona waktu sekolah (bukan zona waktu server), supaya absensi tidak "geser hari".
const TZ = process.env.SCHOOL_TIMEZONE || 'Asia/Jakarta';

export function nowInSchoolTz(d: Date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

// Geser tanggal "YYYY-MM-DD" sebanyak n hari (negatif = mundur), tanpa dipengaruhi zona waktu server.
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}
