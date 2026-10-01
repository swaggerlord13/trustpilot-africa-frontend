/**
 * Turn a saved company/brand website into a link that opens that website.
 * "acme.com" -> "https://acme.com" (without the scheme the browser would treat
 * it as a page on our own site); "shop.acme.ng:8443" keeps its port.
 * Anything that isn't a web address ("javascript:...", "mailto:...", junk)
 * gives "", so callers can skip the link.
 */
export function externalUrl(value) {
  // Nothing saved
  if (typeof value !== "string" || !value.trim()) return "";
  const text = value.trim();
  let candidate;
  if (/^https?:\/\//i.test(text)) {
    // Already a web link
    candidate = text;
  } else if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(text)) {
    // Another scheme such as "javascript:" or "mailto:" (a port is "host:123")
    return "";
  } else {
    // Bare domain, maybe with a port or a leading "//": assume https
    candidate = `https://${text.replace(/^\/+/, "")}`;
  }
  try {
    // Must parse as a real http(s) address
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? candidate : "";
  } catch {
    return "";
  }
}
