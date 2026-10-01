import api from "../api.js";
import ButtonSpinner from "./ButtonSpinner.jsx";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [pagination, setPagination] = useState(null);
  const isDesktop = useIsDesktop(1024);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Shared company info (fetched once, reused across pages)
  const companyInfoRef = useRef(null);

  const fetchCompanyReviews = useCallback(async (sort, page, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      // Fetch company info only once
      if (!companyInfoRef.current) {
        const companyRes = await api.get(`/companies/slug/${companyId}/with-ratings`);
        companyInfoRef.current = companyRes.data.company;
      }
      const company = companyInfoRef.current;

      const reviewsRes = await api.get(
        `/reviews/company/${companyId}?sort=${sort}&page=${page}&limit=20`
      );

      const { reviews: rawReviews, pagination: pag } = reviewsRes.data;

      const mappedReviews = rawReviews.map((review) => ({
        _id: review._id,
        title: review.title || "Review",
        comment: review.comment,
        rating: review.rating,
        user: review.user?.name || "Anonymous",
        image: review.user?.profileImage || "",
        date: new Date(review.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        company: company.name,
        url: `/company/${company.slug}`,
        companyimage: company.logo || "",
        category: company.category?.name || "General",
        companyUrl: company.url || "",
        createdAt: review.createdAt,
      }));

      if (append) {
        setReviews((prev) => [...prev, ...mappedReviews]);
      } else {
        setReviews(mappedReviews);
      }
      setPagination(pag);
    } catch (err) {
      console.error("Error fetching company reviews:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [companyId]);

  const fetchHomepageReviews = useCallback(async () => {
    try {
      const response = await api.get(`/companies/latest-best-reviews`);

      const formattedReviews = response.data.reviews.map((review) => ({
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
        createdAt: review.createdAt,
      }));

      setReviews(formattedReviews);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setLoading(false);
    }
  }, []);

  // Initial fetch (sort changes are handled by handleSortChange, not this effect)
  useEffect(() => {
    if (companyId) {
      fetchCompanyReviews("newest", 1);
    } else {
      fetchHomepageReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Handle sort change — reset to page 1
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setReviews([]);
    setPagination(null);
    fetchCompanyReviews(newSort, 1);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (pagination && pagination.hasMore) {
      fetchCompanyReviews(sortBy, pagination.page + 1, true);
    }
  };

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

  const visibleReviews = companyId
    ? reviews
    : isDesktop
      ? reviews.slice(0, 12)
      : reviews.slice(0, 25);

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

          {/* Desktop slider arrows (homepage only) */}
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

      {/* Sort bar — company page only */}
      {companyId && reviews.length > 0 && (
        <ReviewSortBar
          currentSort={sortBy}
          onSortChange={handleSortChange}
          totalReviews={pagination?.total}
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

        {/* Dot indicators: mobile only, homepage only */}
        {!isDesktop && !companyId && visibleReviews.length > 1 && (
          <ScrollDots scrollRef={scrollRef} itemCount={visibleReviews.length} />
        )}
      </div>

      {/* Load More button — company page only */}
      {companyId && pagination?.hasMore && (
        <div className="flex justify-center mt-8 mb-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-300 disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <ButtonSpinner size="w-4 h-4" /> Loading...
              </span>
            ) : (
              `Show More Reviews (${reviews.length} of ${pagination.total})`
            )}
          </button>
        </div>
      )}

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
