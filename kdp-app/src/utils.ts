export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** বাংলাদেশি ফরম্যাটে টাকা (লাখ-স্টাইল গ্রুপিং) */
export function fmtBDT(n: number): string {
  return '৳' + Math.round(n).toLocaleString('en-IN');
}

export function fmtUSD(n: number): string {
  return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(iso: string): string {
  const d = parseDate(iso.slice(0, 10));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** সপ্তাহের শুরু (সোমবার) */
export function startOfWeek(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (copy.getDay() + 6) % 7; // সোমবার = 0
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return todayStr().slice(0, 7);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return clamp((part / total) * 100, 0, 100);
}
