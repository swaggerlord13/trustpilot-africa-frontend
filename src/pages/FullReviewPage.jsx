import api from "../api.js";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../pages/Header";
import Loader from "../components/Loader";
import StarRating from "../components/StarRatings";
import Footer from "../components/Footer.jsx";
import CompanyLogo from "../components/CompanyLogo";

const FullReviewPage = () => {
  const { reviewId } = useParams();
  const [review, setReview] = useState(null);
  const [relatedReviews, setRelatedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyReply, setCompanyReply] = useState(null);

  useEffect(() => {
    const fetchReviewData = async () => {
      // Clear previous review's reply so it doesn't bleed into the next one
      setCompanyReply(null);
      try {
        // Fetch the main review
        const reviewResponse = await api.get(`/reviews/${reviewId}`);
        const reviewData = reviewResponse.data;

        // Format the review data
        const formattedReview = {
          _id: reviewData._id,
          title: reviewData.title || "Review",
          comment: reviewData.comment,
          rating: reviewData.rating,
          user: reviewData.user?.name || "Anonymous",
          userImage: reviewData.user?.profileImage || "/default-avatar.svg",
          date: new Date(reviewData.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          company: reviewData.company?.name,
          companySlug: reviewData.company?.slug,
          companyImage: reviewData.company?.logo || reviewData.company?.companyImage || "",
          category: reviewData.company?.category?.name || "General",
          companyUrl: reviewData.company?.url,
          createdAt: reviewData.createdAt
        };

        setReview(formattedReview);

        // Fetch company reply for this review
        try {
          const replyRes = await api.get(`/reviews/${reviewId}/replies`);
          setCompanyReply(replyRes.data || null);
        } catch (err) {
          setCompanyReply(null);
        }

        // Fetch related reviews from the same company
        if (reviewData.company?._id) {
          const relatedResponse = await api.get(
            `/reviews/company/${reviewData.company._id}`
          );
          
          const related = relatedResponse.data
            .filter(r => r._id !== reviewId) // Exclude current review
            .slice(0, 3) // Limit to 3 related reviews
            .map(r => ({
              _id: r._id,
              title: r.title || "Review",
              comment: r.comment,
              rating: r.rating,
              user: r.user?.name || "Anonymous",
              date: new Date(r.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            }));
          
          setRelatedReviews(related);
        }

      } catch (err) {
        console.error("Error fetching review:", err);
      } finally {
        setLoading(false);
      }
    };

    if (reviewId) {
      fetchReviewData();
    }
  }, [reviewId]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader message="Loading review..." />
        </div>
      </>
    );
  }

  if (!review) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-50 rounded-full flex items-center justify-center">
            <i className="bx bx-file-find text-3xl text-brand-500"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Review Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            The review you're looking for doesn't exist or may have been removed.
          </p>
          <Link
            to="/browse-reviews"
            className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold"
          >
            Browse All Reviews
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="text-sm text-slate-500 dark:text-slate-400">
              <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/browse-reviews" className="hover:text-brand-500 transition-colors">Reviews</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">Review Details</span>
            </nav>
          </div>

          {/* Main Review Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden mb-8">
            
            {/* Review Header */}
            <div className="p-8 pb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={review.userImage}
                    alt={review.user}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                    onError={(e) => {
                      e.target.src = "/default-avatar.svg";
                    }}
                  />
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{review.user}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{review.date}</p>
                  </div>
                </div>
                
                {/* Rating */}
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={review.rating} />
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {review.rating}/5
                    </span>
                  </div>
                  <div className={`text-sm font-medium ${
                    review.rating <= 2 ? 'text-red-600' : 
                    review.rating === 3 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {review.rating <= 2 ? 'Poor' : 
                     review.rating === 3 ? 'Average' : 
                     review.rating === 4 ? 'Good' : 'Excellent'}
                  </div>
                </div>
              </div>

              {/* Review Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                {review.title}
              </h1>

              {/* Full Review Content */}
              <div className="prose prose-lg max-w-none text-slate-700 dark:text-slate-200 leading-relaxed">
                <p className="whitespace-pre-line text-base md:text-lg">
                  {review.comment}
                </p>
              </div>
            </div>

            {/* Company Reply Section */}
            {companyReply && (
              <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-700">
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                      <i className="bx bx-buildings text-brand-600 text-lg"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-700">Response from {review.company}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(companyReply.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{companyReply.content}</p>
                </div>
              </div>
            )}

            {/* Company Info Section */}
            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900 border-t">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">About This Company</h3>
              <Link 
                to={`/company/${review.companySlug}`}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <CompanyLogo
                  logo={review.companyImage}
                  url={review.companyUrl}
                  name={review.company}
                  size={64}
                />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                    {review.company}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 mb-2">{review.category}</p>
                  {review.companyUrl && (
                    <a
                      href={review.companyUrl.startsWith('http') ? review.companyUrl : `https://${review.companyUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:text-brand-600 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Related Reviews Section */}
          {relatedReviews.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                More Reviews for {review.company}
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedReviews.map((relatedReview) => (
                  <Link
                    key={relatedReview._id}
                    to={`/review/${relatedReview._id}`}
                    className="block p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={relatedReview.rating} />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        by {relatedReview.user}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      {relatedReview.title}
                    </h4>
                    
                    <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3">
                      {relatedReview.comment.length > 100 
                        ? relatedReview.comment.slice(0, 100) + "..." 
                        : relatedReview.comment
                      }
                    </p>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {relatedReview.date}
                    </p>
                  </Link>
                ))}
              </div>
              
              <div className="text-center mt-6">
                <Link
                  to={`/company/${review.companySlug}`}
                  className="inline-flex items-center px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold"
                >
                  View All Reviews for {review.company}
                </Link>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              to="/browse-reviews"
              className="flex-1 py-3 px-6 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-center"
            >
              ← Back to All Reviews
            </Link>
            
            <Link
              to={`/company/${review.companySlug}?openReview=true`}
              className="flex-1 py-3 px-6 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold text-center"
            >
              Write Your Own Review
            </Link>
          </div>

        </div>
      </div>
          <Footer />
    </>
  );
};

export default FullReviewPage;
