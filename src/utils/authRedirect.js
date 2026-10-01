/**
 * Helpers for "send the user back where they were" after logging in.
 * The page to return to travels in the login URL: /login?redirect=/brand/mtn
 */

/**
 * Turn a ?redirect= value into a safe path on THIS site, or "/" if it isn't one.
 * Blocks open redirects such as "//evil.com", "/\evil.com" or
 * "https://evil.com", which would send a freshly logged-in user to a scam page.
 */
export function safeRedirect(value) {
  // Missing or not text: go home
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  try {
    // Resolve against our own origin; anything pointing elsewhere changes the origin
    const url = new URL(value, window.location.origin);
    // Another site: refuse
    if (url.origin !== window.location.origin) return "/";
    // Never bounce back to the login page itself (would loop); routes ignore case
    if (url.pathname.toLowerCase() === "/login") return "/";
    // Path, query and #hash on our site
    const path = `${url.pathname}${url.search}${url.hash}`;
    // Tidying "/.//evil.com" or "/a/..//evil.com" can leave "//evil.com",
    // which browsers read as another site: refuse anything starting // or /\
    if (path.startsWith("//") || path.startsWith("/\\")) return "/";
    return path;
  } catch {
    // Not a valid URL at all
    return "/";
  }
}

/**
 * Login page URL that returns to `path` afterwards, e.g.
 * loginUrl("/brand/mtn?state=Lagos") -> "/login?redirect=%2Fbrand%2Fmtn%3Fstate%3DLagos"
 * Home ("/") and the login page itself need no redirect.
 */
export function loginUrl(path) {
  // Nothing worth returning to
  if (!path || path === "/" || path.toLowerCase().startsWith("/login")) return "/login";
  return `/login?redirect=${encodeURIComponent(path)}`;
}

/**
 * Login URL that returns to the page the browser is on right now.
 */
export function loginUrlForCurrentPage() {
  // Path + query + hash of the current page
  const { pathname, search, hash } = window.location;
  return loginUrl(`${pathname}${search}${hash}`);
}
