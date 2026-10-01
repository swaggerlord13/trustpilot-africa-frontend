// Shared colour scale for stars
import { starColor } from "../utils/starColor.js";

function StarRating({ rating }) {
  // Same colour scale everywhere stars are shown
  const activeColor = starColor(rating);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <span key={i} className="text-2xl" style={{ color: i < rating ? activeColor : "#ccc" }}>★</span>
    );
  }
  return <div className="star">{stars}</div>;
}
export default StarRating