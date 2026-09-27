import React, { useState } from "react";

/**
 * Extracts the domain from a URL string.
 * e.g. "https://www.flutterwave.com/about" → "flutterwave.com"
 */
function getDomain(url) {
  if (!url) return null;
  try {
    let cleaned = url.trim();
    if (!cleaned.startsWith("http")) cleaned = "https://" + cleaned;
    const hostname = new URL(cleaned).hostname;
    // Strip "www." prefix
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Picks a background color from the company name — keeps it consistent
 * every time the same company renders.
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
 * CompanyLogo — shows the real logo when available, tries Clearbit when
 * only a URL exists, and falls back to a colorful letter avatar.
 *
 * Props:
 *   logo     - stored logo URL (from the DB)
 *   url      - company website URL (used to try Clearbit)
 *   name     - company name (used for the letter avatar fallback)
 *   size     - pixel size, default 56
 *   className - extra CSS classes on the outer wrapper
 */
const CompanyLogo = ({ logo, url, name = "?", size = 56, className = "" }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [clearbitFailed, setClearbitFailed] = useState(false);

  const domain = getDomain(url);
  const letter = name.charAt(0).toUpperCase();
  const bg = nameColor(name);

  const wrapperStyle = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: 12,
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

  // 1. If there's a stored logo in the DB — show it
  if (logo && !imgFailed) {
    return (
      <div style={wrapperStyle} className={className}>
        <img
          src={logo}
          alt={name}
          style={imgStyle}
          onError={() => setImgFailed(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // 2. If there's a URL, try Clearbit logo API
  if (domain && !clearbitFailed) {
    return (
      <div style={wrapperStyle} className={className}>
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={name}
          style={imgStyle}
          onError={() => setClearbitFailed(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Fallback: colorful letter avatar
  return (
    <div
      style={{
        ...wrapperStyle,
        backgroundColor: bg,
        border: "none",
      }}
      className={className}
    >
      <span
        style={{
          color: "#fff",
          fontWeight: 700,
          fontSize: size * 0.4,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {letter}
      </span>
    </div>
  );
};

export default CompanyLogo;
