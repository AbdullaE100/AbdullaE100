// Offers travel as ordinary chat messages with a recognisable first line,
// so they need no schema change: "Offer: Rs 8,400,000\n<optional note>".
const RE = /^Offer: Rs ([\d,]{4,15})\s*(?:\n([\s\S]*))?$/;

export function formatOffer(amount: number, note = "") {
  const head = `Offer: Rs ${Math.round(amount).toLocaleString("en-LK")}`;
  return note.trim() ? `${head}\n${note.trim()}` : head;
}

export function parseOffer(body: string): { amount: number; note: string } | null {
  const m = RE.exec(body.trim());
  if (!m) return null;
  const amount = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? { amount, note: (m[2] ?? "").trim() } : null;
}
