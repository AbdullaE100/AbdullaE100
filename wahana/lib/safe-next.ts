const BASE = "https://wahana.invalid";

/**
 * Only allow same-site relative redirects. Rejects control characters and
 * backslashes (browsers strip or normalise them, which can turn "/\t/evil.com"
 * into "//evil.com"), then confirms the path resolves to our own origin.
 */
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (!next || next.length > 512 || !next.startsWith("/")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  try {
    const url = new URL(next, BASE);
    if (url.origin !== BASE) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
