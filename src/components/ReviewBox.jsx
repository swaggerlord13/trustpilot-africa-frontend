import '../styles/ReviewBox.css'
import { Link } from "react-router-dom";
import { useState } from "react";
import StarRating from './StarRatings';

export default function ReviewBox({ _id, title, comment, rating, user, date, company, url, image, companyimage, category }) {
  const [imageError, setImageError] = useState(false);
  const [companyImageError, setCompanyImageError] = useState(false);

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

  const handleCompanyImageError = (e) => {
    if (!companyImageError) {
      e.target.src = "https://via.placeholder.com/150?text=Company+Logo";
      setCompanyImageError(true);
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
            <img 
              src={companyimage} 
              alt={`${company} logo`}
              onError={handleCompanyImageError}
            />
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
