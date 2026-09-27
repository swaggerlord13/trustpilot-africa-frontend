import { API_BASE_URL } from "../config.js";
import ReviewBox from "./ReviewBox.jsx";
import "../styles/ReviewsText.css";
import { useState, useEffect } from "react";
import Loader from "./Loader.jsx";
import ReviewForm from "./ReviewForm.jsx";
import axios from "axios";

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
  const isDesktop = useIsDesktop(1200);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        if (companyId) {
          // Company-specific reviews - keep existing logic
          const reviewsRes = await axios.get(`${API_BASE_URL}/reviews/company/${companyId}`);
          
          // Get the company data to ensure we have populated category info
          const companyRes = await axios.get(`${API_BASE_URL}/companies/slug/${companyId}/with-ratings`);
          
          const mappedReviews = reviewsRes.data.map((review) => ({
            _id: review._id,
            title: review.title || "Review",
            comment: review.comment,
            rating: review.rating,
            user: review.user?.name || "Anonymous",
            image: review.user?.profileImage || "https://via.placeholder.com/100?text=User",
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
                  return `https://logo.clearbit.com/${new URL(cleaned).hostname.replace(/^www\./, "")}`;
                }
              } catch {}
              return "https://via.placeholder.com/150?text=Company+Logo";
            })(),
            category: companyRes.data.company.category?.name || "General",
            createdAt: review.createdAt
          }));

          setReviews(mappedReviews);
        } else {
          // Homepage: Get optimized latest best reviews from backend
          console.log("Fetching latest best reviews from backend...");
          
          const response = await axios.get(`${API_BASE_URL}/companies/latest-best-reviews`);
          
          console.log("Received reviews:", response.data.reviews.length);
          
          // Reviews are already formatted by the backend
          const formattedReviews = response.data.reviews.map(review => ({
            _id: review._id,
            title: review.title,
            comment: review.comment,
            rating: review.rating,
            user: review.user || "Anonymous",
            image: review.image,
            date: review.date, // Already formatted by backend
            company: review.company,
            url: review.url,
            companyimage: review.companyimage,
            category: review.category, // This will now show properly!
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

  // Keep your existing logic for desktop/mobile display limits
  const visibleReviews = isDesktop ? reviews.slice(0, 6) : reviews.slice(0, 25);

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
        <h2 className="text-2xl font-bold text-gray-800">
          {companyId ? "Company Reviews" : "Latest Best Reviews"}
        </h2>
        {!companyId && (
          <p className="text-gray-600 mt-2">
            {reviews.length} latest reviews from top-rated companies
          </p>
        )}
      </div>

      {/* Only show form if we are on a company page */}
      {companyId && (
        <ReviewForm
          companyId={companyId}
          onReviewAdded={(newReview) =>
            setReviews((prev) => [newReview, ...prev])
          }
        />
      )}

      <div className="reviews">
        <div className="reviewscomments-row">
          {visibleReviews.map((review, index) => (
           <ReviewBox
              key={review._id || index}
              _id={review._id} // Add this line
              image={review.image}
              company={review.company}
              url={review.url}
              title={review.title}
              comment={review.comment}
              rating={review.rating}
              user={review.user}
              date={review.date}
              companyimage={review.companyimage}
              category={review.category}
            />
          ))}
        </div>
      </div>
      
      {reviews.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💭</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No reviews found
          </h3>
          <p className="text-gray-500">
            {companyId ? "This company has no reviews yet." : "No reviews available at the moment."}
          </p>
        </div>
      )}
    </>
  );
}