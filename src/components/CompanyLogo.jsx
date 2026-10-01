import React, { useState } from "react";
import { getDomain, getUsableImage } from "../utils/imageUtils";

/**
 * Picks a background color from the company name.
 */
const COLORS = [
  "#1B6B3A", "#2563EB", "#7C3AED", "#DC2626",
  "#D97706", "#0891B2", "#4F46E5", "#059669",
  "#BE185D", "#EA580C", "#0D9488", "#6D28D9",
];

function nameColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

/**
 * CompanyLogo: the one place that decides which logo to show for a company.
 *
 * Chain: DB logo -> Google Favicon (high-res 128px) -> letter avatar
 *
 * Placeholder logo URLs from the API are ignored so they fall through to the
 * favicon. Google Favicon covers virtually every website on the internet,
 * so this catches African companies reliably.
 */
const CompanyLogo = ({ logo, url, name, size = 56, className = "" }) => {
  // Track failed URLs (not booleans) so new props get a fresh attempt
  const [failed, setFailed] = useState(() => new Set());
  const markFailed = (src) => setFailed((prev) => new Set(prev).add(src));

  const displayName = (name || "").trim() || "?";
  const letter = displayName.charAt(0).toUpperCase();
  const bg = nameColor(displayName);

  const logoSrc = getUsableImage(logo);
  const domain = getDomain(url);
  const faviconSrc = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : null;

  const wrapperStyle = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: Math.min(12, Math.round(size / 4)),
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
  };

  const imgStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  // 1. Stored logo from DB
  if (logoSrc && !failed.has(logoSrc)) {
    return (
      <div style={wrapperStyle} className={className}>
        <img
          src={logoSrc}
          alt={displayName}
          style={imgStyle}
          onError={() => markFailed(logoSrc)}
          loading="lazy"
        />
      </div>
    );
  }

  // 2. Google Favicon API (high-res 128px). Covers almost every website
  if (faviconSrc && !failed.has(faviconSrc)) {
    return (
      <div style={wrapperStyle} className={className}>
        <img
          src={faviconSrc}
          alt={displayName}
          style={{ ...imgStyle, padding: size > 40 ? 8 : size > 28 ? 4 : 2 }}
          onError={() => markFailed(faviconSrc)}
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Colorful letter avatar fallback
  return (
    <div
      style={{
        ...wrapperStyle,
        backgroundColor: bg,
        border: "none",
      }}
      className={className}
      role="img"
      aria-label={displayName}
    >
      <span
        style={{
          color: "#fff",
          fontWeight: 700,
          fontSize: size * 0.4,
          lineHeight: 1,
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        {letter}
      </span>
    </div>
  );
};

export default CompanyLogo;
