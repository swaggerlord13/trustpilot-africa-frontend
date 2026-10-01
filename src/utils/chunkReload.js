// Recovers from "stale page" errors that happen right after a new deploy.
// Each deploy renames the JS files ("chunks"). A browser tab opened before the
// deploy still asks for the OLD file names, which no longer exist, so opening
// a lazily loaded page fails until the user reloads. We reload for them, once.

// sessionStorage key set when we auto-reload, cleared once the app is stable
const RELOADED_KEY = "tpa:chunk-reloaded";

// How long the app must run without trouble before another auto-reload is allowed
const STABLE_AFTER_MS = 30_000;

// Error messages browsers use when a lazily loaded JS file can't be loaded
const CHUNK_ERROR_PATTERNS = [
  // Chrome and Edge
  /Failed to fetch dynamically imported module/i,
  // Safari
  /Importing a module script failed/i,
  // Firefox
  /error loading dynamically imported module/i,
  // Any browser, when the server answered with an HTML page instead of JS
  /is not a valid JavaScript MIME type/i,
  // Vite's preload helper, when a page's CSS file is missing
  /Unable to preload CSS/i,
];

/**
 * True when the error means "a JS/CSS file from an older deploy is missing".
 */
export function isChunkLoadError(error) {
  // Use the message when there is one, otherwise the value itself as text
  const message = String(error?.message ?? error ?? "");
  // Match against every known browser wording
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * True when the browser reports it has no network connection.
 */
export function isOffline() {
  // navigator.onLine is false only when the device is definitely offline
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Reload once to fetch the newest deploy.
 * Returns true if a reload was started. Returns false (show the error page
 * instead) when offline, if we already auto-reloaded recently, or if storage
 * is blocked, because without storage we can't guarantee we won't loop.
 */
export function reloadForNewVersion() {
  // Offline: the file failed because there is no internet, not a new deploy.
  // Reloading would only show the browser's offline page and lose typed text.
  if (isOffline()) return false;
  try {
    // Already auto-reloaded and the app never became stable: stop here
    if (sessionStorage.getItem(RELOADED_KEY)) return false;
    // Remember that we are reloading, so a repeat failure won't reload again
    sessionStorage.setItem(RELOADED_KEY, "1");
  } catch {
    // Storage blocked (privacy settings, sandboxed frame): never auto-reload
    return false;
  }
  // Ask the browser for the page again, which loads the newest deploy
  window.location.reload();
  // Tell the caller a reload is under way
  return true;
}

/**
 * Allow a future auto-reload once the app has run normally for a while.
 * Call once at startup. A later deploy can then be recovered from too,
 * while a page that keeps failing straight after a reload can't loop.
 */
export function markAppStableLater() {
  // Wait until the app has been working for STABLE_AFTER_MS
  window.setTimeout(() => {
    try {
      // Clear the flag so the next stale-deploy error may reload once more
      sessionStorage.removeItem(RELOADED_KEY);
    } catch {
      // Storage blocked: nothing was stored, so nothing to clear
    }
  }, STABLE_AFTER_MS);
}
