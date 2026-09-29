function StarRating({ rating }) {
  let activeColor;
  if (rating <=2) {
    activeColor = "#EF4444";
  } else if (rating === 3) {
    activeColor = "#F59E0B";
  }else {
    activeColor = "#22C55E";
  }
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <span key={i} className="text-2xl" style={{ color: i < rating ? activeColor : "#ccc" }}>★</span>
    );
  }
  return <div className="star">{stars}</div>;
}
export default StarRating