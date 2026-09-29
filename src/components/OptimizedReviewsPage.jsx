import api, { API_BASE_URL } from "../api.js";
import ReviewBox from "./ReviewBox.jsx";
import "../styles/ReviewsText.css";
import { useState, useEffect, useRef, useCallback } from "react";
import Loader from "./Loader.jsx";
import ReviewForm from "./ReviewForm.jsx";
import ScrollDots from "./ScrollDots.jsx";

function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= breakpoint : true
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const handle = (e) => setIsDesktop(e.matches);

    if (mql.addEventListener) mql.addEventListener("change", handle);
    else mql.addEventListener(handle);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handle);
      else mql.removeEventListener(handle);
    };
  }, [breakpoint]);

  return isDesktop;
}


export default function OptimizedReviewsPage({ companyId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDesktop = useIsDesktop(1024);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        if (companyId) {
          const reviewsRes = await api.get(`${API_BASE_URL}/reviews/company/${companyId}`);
          const companyRes = await api.get(`${API_BASE_URL}/companies/slug/${companyId}/with-ratings`);

          const mappedReviews = reviewsRes.data.map((review) => ({
            _id: review._id,
            title: review.title || "Review",
            comment: review.comment,
            rating: review.rating,
            user: review.user?.name || "Anonymous",
            image: review.user?.profileImage || "/default-avatar.svg",
            date: new Date(review.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            company: companyRes.data.company.name,
            url: `/company/${companyRes.data.company.slug}`,
            companyimage: companyRes.data.company.logo || (() => {
              try {
                const u = companyRes.data.company.url || "";
                if (u) {
                  const cleaned = u.startsWith("http") ? u : "https://" + u;
                  return `https://www.google.com/s2/favicons?domain=${new URL(cleaned).hostname.replace(/^www\\./, "")}&sz=128`;
                }
              } catch (e) { /* ignore */ }
              return "";
            })(),
            category: companyRes.data.company.category?.name || "General",
            companyUrl: companyRes.data.company.url || "",
            createdAt: review.createdAt
          }));

          setReviews(mappedReviews);
        } else {
          const response = await api.get(`${API_BASE_URL}/companies/latest-best-reviews`);

          const formattedReviews = response.data.reviews.map(review => ({
            _id: review._id,
            title: review.title,
            comment: review.comment,
            rating: review.rating,
            user: review.user || "Anonymous",
            image: review.image,
            date: review.date,
            company: review.company,
            url: review.url,
            companyimage: review.companyimage,
            companyUrl: review.companyUrl || "",
            category: review.category,
            createdAt: review.createdAt
          }));

          setReviews(formattedReviews);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setLoading(false);
      }
    };

    fetchReviews();
  }, [companyId]);

  // Check scroll position for arrow visibility
  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScrollPosition();
    el.addEventListener("scroll", checkScrollPosition, { passive: true });
    // Also check on resize
    window.addEventListener("resize", checkScrollPosition);
    return () => {
      el.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [checkScrollPosition, reviews]);

  const scrollByAmount = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".Reviewcomments")?.offsetWidth || 320;
    el.scrollBy({ left: direction * (cardWidth + 16), behavior: "smooth" });
  };

  const visibleReviews = isDesktop ? reviews.slice(0, 12) : reviews.slice(0, 25);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader message="Loading Reviews..." />
      </div>
    );
  }

  return (
    <>
      <div className="reviews-header mb-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              {companyId ? "Company Reviews" : "Latest Best Reviews"}
            </h2>
            {!companyId && (
              <p className="text-gray-600 dark:text-slate-400 mt-2">
                {reviews.length} latest reviews from top-rated companies
              </p>
            )}
          </div>

          {/* Desktop slider arrows */}
          {isDesktop && !companyId && visibleReviews.length > 3 && (
            <div className="flex gap-2">
              <button
                onClick={() => scrollByAmount(-1)}
                disabled={!canScrollLeft}
                className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Scroll left"
              >
                <i className="bx bx-chevron-left text-xl text-slate-600 dark:text-slate-300"></i>
              </button>
              <button
                onClick={() => scrollByAmount(1)}
                disabled={!canScrollRight}
                className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Scroll right"
              >
                <i className="bx bx-chevron-right text-xl text-slate-600 dark:text-slate-300"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {companyId && (
        <ReviewForm
          companyId={companyId}
          onReviewAdded={(newReview) =>
            setReviews((prev) => [newReview, ...prev])
          }
        />
      )}

      <div className="reviews">
        <div className={companyId ? "reviewscomments-row" : "reviewscomments-row reviews-slider"} ref={scrollRef}>
          {visibleReviews.map((review, index) => (
            <ReviewBox
              key={review._id || index}
              _id={review._id}
              image={review.image}
              company={review.company}
              url={review.url}
              title={review.title}
              comment={review.comment}
              rating={review.rating}
              user={review.user}
              date={review.date}
              companyimage={review.companyimage}
              companyUrl={review.companyUrl}
              category={review.category}
            />
          ))}
        </div>

        {/* Dot indicators: mobile only */}
        {!isDesktop && visibleReviews.length > 1 && (
          <ScrollDots scrollRef={scrollRef} itemCount={visibleReviews.length} />
        )}
      </div>

      {reviews.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">&#128173;</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2">
            No reviews found
          </h3>
          <p className="text-gray-500 dark:text-slate-400">
            {companyId ? "This company has no reviews yet." : "No reviews available at the moment."}
          </p>
        </div>
      )}
    </>
  );
}
