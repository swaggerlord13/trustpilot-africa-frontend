import '../styles/ReviewBox.css'
import { Link } from "react-router-dom";
import { useState } from "react";
import StarRating from './StarRatings';

export default function ReviewBox({ _id, title, comment, rating, user, date, company, url, image, companyimage, companyUrl, category }) {
  const [imageError, setImageError] = useState(false);
  const [companyImgStage, setCompanyImgStage] = useState(0); // 0=original, 1=google favicon, 2=letter

  const charLimits = {
    mobile: 137,
    tablet: 215,
    desktop: 152,
  };

  function getDeviceType() {
    const width = window.innerWidth;
    if (width <= 576) return 'mobile';
    if (width <= 768) return 'tablet';
    return 'desktop';
  }

  const charLimit = charLimits[getDeviceType()];
  const isLong = comment.length > charLimit;
  const displayText = isLong ? comment.slice(0, charLimit) + " ..." : comment;

  const handleImageError = (e) => {
    if (!imageError) {
      e.target.src = "https://via.placeholder.com/100?text=User";
      setImageError(true);
    }
  };

  const getDomain = (u) => {
    if (!u) return null;
    try {
      let c = u.trim();
      if (!c.startsWith("http")) c = "https://" + c;
      return new URL(c).hostname.replace(/^www\./, "");
    } catch { return null; }
  };

  const companyDomain = getDomain(companyUrl);

  const handleCompanyImageError = (e) => {
    if (companyImgStage === 0 && companyDomain) {
      // Try Google Favicon (high-res)
      e.target.src = `https://www.google.com/s2/favicons?domain=${companyDomain}&sz=128`;
      setCompanyImgStage(1);
    } else {
      // Final fallback: hide img and show letter
      setCompanyImgStage(2);
    }
  };

  const companyLetter = (company || "?").charAt(0).toUpperCase();
  const LOGO_COLORS = ["#1B6B3A","#2563EB","#7C3AED","#DC2626","#D97706","#0891B2","#4F46E5","#059669"];
  const letterBg = LOGO_COLORS[Math.abs([...(company||"")].reduce((h,c)=>c.charCodeAt(0)+((h<<5)-h),0)) % LOGO_COLORS.length];

  return (
    <div className="Reviewcomments">
      {/* Reviewer */}
      <div className="profiledetails">
        <img 
          src={image} 
          alt={`${user}'s profile`}
          onError={handleImageError}
        />
        <p><strong>{user}</strong></p>
      </div>

      {/* Review content — flex-grows to fill space */}
      <div className="review-body">
        <h3 className="review-title">{title}</h3>
        <StarRating rating={rating} />
        <p>
          {displayText}
          {isLong && (
            <Link className="readmore" to={`/review/${_id}`}>Read More</Link>
          )}
        </p>
        <p className="bydate">
          <strong>{date}</strong>
        </p>
      </div>

      {/* Company footer — always pinned to bottom */}
      <Link to={url}>
        <div className="companydetails">
          <div className="company-logo-wrap">
            {companyImgStage < 2 ? (
              <img 
                src={companyimage} 
                alt={`${company} logo`}
                onError={handleCompanyImageError}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%", display: "flex", alignItems: "center",
                justifyContent: "center", backgroundColor: letterBg, borderRadius: 8
              }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{companyLetter}</span>
              </div>
            )}
          </div>
          <div className="company-info">
            <span className="company-name">{company}</span>
            <span className="company-category">{category}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
