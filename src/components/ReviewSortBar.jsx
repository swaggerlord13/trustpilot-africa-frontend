import { useState, useRef, useEffect } from "react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", icon: "bx-time-five" },
  { value: "oldest", label: "Oldest First", icon: "bx-history" },
  { value: "highest", label: "Highest Rated", icon: "bx-star" },
  { value: "lowest", label: "Lowest Rated", icon: "bx-star" },
];

export default function ReviewSortBar({ currentSort = "newest", onSortChange, totalReviews }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentOption = SORT_OPTIONS.find((o) => o.value === currentSort) || SORT_OPTIONS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="review-sort-bar">
      <span className="review-sort-count">
        {totalReviews != null ? `${totalReviews} review${totalReviews !== 1 ? "s" : ""}` : ""}
      </span>

      <div className="review-sort-dropdown" ref={dropdownRef}>
        <button
          className="review-sort-trigger"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <i className={`bx ${currentOption.icon}`}></i>
          <span>{currentOption.label}</span>
          <i className={`bx bx-chevron-down review-sort-chevron ${open ? "open" : ""}`}></i>
        </button>

        {open && (
          <ul className="review-sort-menu" role="listbox">
            {SORT_OPTIONS.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === currentSort}
                className={`review-sort-option ${option.value === currentSort ? "active" : ""}`}
                onClick={() => {
                  onSortChange(option.value);
                  setOpen(false);
                }}
              >
                <i className={`bx ${option.icon}`}></i>
                <span>{option.label}</span>
                {option.value === currentSort && <i className="bx bx-check"></i>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
