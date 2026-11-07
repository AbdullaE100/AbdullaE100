const nf = new Intl.NumberFormat("en-LK");

export const formatNumber = (n: number) => nf.format(n);

/** Rs 8,505,000 */
export function formatLKR(n: number | null | undefined) {
  if (n == null) return "";
  return `Rs ${nf.format(Math.round(n))}`;
}

/** Rs 8.5M, Rs 850K */
export function formatLKRCompact(n: number | null | undefined) {
  if (n == null) return "";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const digits = m >= 100 || Number.isInteger(m) ? 0 : m >= 10 ? 1 : 2;
    return `Rs ${trimZeros(m.toFixed(digits))}M`;
  }
  if (n >= 1_000) return `Rs ${trimZeros((n / 1_000).toFixed(n >= 100_000 ? 0 : 1))}K`;
  return `Rs ${nf.format(n)}`;
}

/** 85.05 lakhs. Sri Lankan buyers often think in lakhs (100,000). */
export function formatLakhs(n: number | null | undefined) {
  if (n == null || n < 100_000) return "";
  const l = n / 100_000;
  return `${trimZeros(l.toFixed(l >= 100 ? 0 : 2))} lakhs`;
}

function trimZeros(s: string) {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

export function formatKm(n: number | null | undefined) {
  if (n == null) return "";
  return `${nf.format(n)} km`;
}

export function formatKmShort(n: number | null | undefined) {
  if (n == null) return "";
  if (n >= 1000) return `${trimZeros((n / 1000).toFixed(n >= 100_000 ? 0 : 1))}k km`;
  return `${n} km`;
}

// Hermes (React Native) may lack Intl.RelativeTimeFormat; fall back to plain English.
const rtf: { format: (n: number, unit: Intl.RelativeTimeFormatUnit) => string } =
  typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    : {
        format: (n, unit) => {
          const a = Math.abs(n);
          if (unit === "day" && n === -1) return "yesterday";
          const word = `${a} ${unit}${a === 1 ? "" : "s"}`;
          return n < 0 ? `${word} ago` : `in ${word}`;
        },
      };
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

export function timeAgo(date: string | Date | null | undefined, now = Date.now()) {
  if (!date) return "";
  const secs = Math.round((new Date(date).getTime() - now) / 1000);
  const abs = Math.abs(secs);
  if (abs < 60) return "just now";
  for (const [unit, size] of UNITS) {
    if (abs >= size) return rtf.format(Math.round(secs / size), unit);
  }
  return "just now";
}

// Always Sri Lanka time, so the server (UTC) and the browser render the same text.
export const TZ = "Asia/Colombo";
// Engines without time-zone data reject `timeZone`; fall back to the device zone.
function dtf(locale: string, opts: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat(locale, { ...opts, timeZone: TZ });
  } catch {
    return new Intl.DateTimeFormat(locale, opts);
  }
}
const df = dtf("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dfShort = dtf("en-GB", { day: "numeric", month: "short" });
const tf = dtf("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
const dayKeyFmt = dtf("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });

/** YYYY-MM-DD in Sri Lanka time. */
export const dayKey = (d: string | Date | number) => dayKeyFmt.format(new Date(d));

export const formatDate = (d: string | Date) => df.format(new Date(d));
export const formatDateShort = (d: string | Date) => dfShort.format(new Date(d));
export const formatTime = (d: string | Date) => tf.format(new Date(d));

export function daysUntil(d: string | Date) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

/** Accepts 0771234567, 771234567, +94771234567, 94 77 123 4567 → +94771234567 */
export function normalizeLkPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  let local: string;
  if (digits.startsWith("94")) local = digits.slice(2);
  else if (digits.startsWith("0")) local = digits.slice(1);
  else local = digits;
  if (!/^[1-9]\d{8}$/.test(local)) return null;
  return `+94${local}`;
}

/** +94771234567 → 077 123 4567 */
export function displayLkPhone(e164: string | null | undefined) {
  if (!e164) return "";
  const local = "0" + e164.replace(/^\+94/, "");
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

export function pluralize(n: number, one: string, many = one + "s") {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}
