import { useState, useEffect, useCallback } from "react";

export default function ScrollDots({ scrollRef, itemCount }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return;
    const firstChild = el.children[0];
    if (!firstChild) return;
    const cardWidth = firstChild.offsetWidth + 12;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, itemCount - 1));
  }, [scrollRef, itemCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleDotClick = (index) => {
    const el = scrollRef.current;
    if (!el || !el.children[index]) return;
    el.children[index].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  const maxDots = Math.min(itemCount, 7);
  if (itemCount <= 1) return null;

  return (
    <div className="scroll-dots">
      {Array.from({ length: maxDots }, (_, i) => (
        <button
          key={i}
          className={`scroll-dot ${i === activeIndex ? "active" : ""}`}
          onClick={() => handleDotClick(i)}
          aria-label={`Go to review ${i + 1}`}
        />
      ))}
      {itemCount > maxDots && (
        <span className="scroll-dots-more">+{itemCount - maxDots}</span>
      )}
    </div>
  );
}
