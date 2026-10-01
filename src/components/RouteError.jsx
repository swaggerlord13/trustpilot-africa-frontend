import { useEffect } from "react";
import { useRouteError } from "react-router-dom";
import ErrorScreen from "./ErrorScreen";
import { isChunkLoadError, isOffline, reloadForNewVersion } from "../utils/chunkReload";

/**
 * Shown by React Router when a page fails to load or crashes, instead of the
 * raw "Unexpected Application Error" screen. This is the one place that
 * decides whether to auto-reload after a new deploy.
 */
export default function RouteError() {
  // The error React Router caught while loading or rendering this route
  const error = useRouteError();
  // Missing file from an older deploy: fixable by loading the new version
  const isStaleVersion = isChunkLoadError(error);

  useEffect(() => {
    // Log the real error for debugging; visitors only see the friendly text
    console.error("Route error:", error);
    // Stale deploy: reload once to get the new files (guarded against loops)
    if (isStaleVersion) reloadForNewVersion();
  }, [error, isStaleVersion]);

  // No internet: the page file couldn't download, so say so plainly
  if (isStaleVersion && isOffline()) {
    return (
      <ErrorScreen
        icon="bx-wifi-off"
        title="You're offline"
        message="Check your internet connection, then refresh the page."
      />
    );
  }

  // Stale deploy: shown briefly while the reload starts, or if it was skipped
  if (isStaleVersion) {
    return (
      <ErrorScreen
        icon="bx-refresh"
        title="The site was just updated"
        message="Refresh the page to load the latest version."
      />
    );
  }

  // Any other crash: generic message with Refresh and Home buttons
  return (
    <ErrorScreen
      title="Something went wrong"
      message="Please refresh the page, or go back to the homepage."
    />
  );
}
