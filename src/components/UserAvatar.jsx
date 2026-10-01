import { useState } from "react";
import { DEFAULT_AVATAR, getUsableImage } from "../utils/imageUtils";

/**
 * UserAvatar: the one place that decides which picture to show for a person.
 *
 * Chain: uploaded/Google profile image -> /default-avatar.svg
 *
 * Placeholder URLs (empty strings, dead placeholder services, random-avatar
 * services) are skipped so every page shows the same default avatar.
 */
const UserAvatar = ({ src, alt = "", className = "", ...rest }) => {
  const usable = getUsableImage(src);
  // Remember which URL failed so a new src gets a fresh attempt
  const [failedSrc, setFailedSrc] = useState(null);

  const showDefault = !usable || failedSrc === usable;

  return (
    <img
      {...rest}
      src={showDefault ? DEFAULT_AVATAR : usable}
      alt={alt}
      className={className}
      onError={() => {
        if (!showDefault) setFailedSrc(usable);
      }}
    />
  );
};

export default UserAvatar;
