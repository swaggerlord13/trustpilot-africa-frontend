import '../styles/ReviewBox.css'
import { Link } from "react-router-dom";
import { useState } from "react";
import StarRating from './StarRatings';
import CompanyLogo from './CompanyLogo';

export default function ReviewBox({ _id, title, comment, rating, user, date, company, url, image, companyimage, companyUrl, category }) {
  const [imageError, setImageError] = useState(false);

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
      e.target.src = "/default-avatar.svg";
      setImageError(true);
    }
  };

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

      {/* Review content: flex-grows to fill space */}
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

      {/* Company footer: always pinned to bottom */}
      <Link to={url}>
        <div className="companydetails">
          <CompanyLogo logo={companyimage} url={companyUrl} name={company || "?"} size={42} />
          <div className="company-info">
            <span className="company-name">{company}</span>
            <span className="company-category">{category}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
