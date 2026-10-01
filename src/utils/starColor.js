// Colour for a star rating, used everywhere stars are shown:
// 1-2 red, 3 amber, 4-5 green
export function starColor(rating) {
  if (rating <= 2) return "#EF4444";
  if (rating === 3) return "#F59E0B";
  return "#22C55E";
}
