export const DEFAULT_AVATAR = "/default-avatar.svg";

/**
 * Hosts the backend (or older frontend code) has used as stand-in images.
 * These are not real uploads: via.placeholder.com no longer resolves and
 * avatar.iran.liara.run/public returns a different random face on every
 * request, so any URL on these hosts is treated as "no image".
 */
const PLACEHOLDER_HOSTS = new Set([
  "via.placeholder.com",
  "placeholder.com",
  "placehold.it",
  "placehold.co",
  "avatar.iran.liara.run",
]);

/**
 * Returns the URL if it points at a real image, otherwise null.
 * Relative paths (e.g. "/uploads/x.png") are allowed through.
 */
export function getUsableImage(src) {
  if (typeof src !== "string") return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  try {
    const { hostname } = new URL(trimmed, window.location.origin);
    if (PLACEHOLDER_HOSTS.has(hostname.replace(/^www\./, ""))) return null;
  } catch {
    return null;
  }
  return trimmed;
}

/**
 * Extracts the bare domain from a website URL.
 * e.g. "https://www.flutterwave.com/about" -> "flutterwave.com"
 */
export function getDomain(url) {
  if (typeof url !== "string" || !url.trim()) return null;
  try {
    let cleaned = url.trim();
    if (!/^https?:\/\//i.test(cleaned)) cleaned = "https://" + cleaned;
    const hostname = new URL(cleaned).hostname.replace(/^www\./, "");
    return hostname.includes(".") ? hostname : null;
  } catch {
    return null;
  }
}
