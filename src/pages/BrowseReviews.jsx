import { API_BASE_URL } from "../config.js";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Header from "../pages/Header";
import Loader from "../components/Loader";
import StarRating from "../components/StarRatings";
import Footer from "../components/Footer.jsx";

const BrowseReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchMixedReviews = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/reviews/browse-mixed?page=${currentPage}&limit=20${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`
        );
        setReviews(response.data.reviews || []);
        setPagination(response.data.pagination || {});
      } catch (err) {
        console.error("Error fetching mixed reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMixedReviews();
  }, [currentPage, debouncedSearch]);

  const truncateText = (text, limit = 200) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit);
  };

  const needsTruncation = (text, limit = 200) => {
    return text.length > limit;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader message="Loading reviews..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
              See What People Are Saying
            </h1>
            <p className="text-lg max-w-3xl mx-auto text-slate-500 dark:text-slate-400">
              Discover authentic reviews from real customers across different companies and industries.
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-brand-500 to-coral-400 mx-auto mt-6 rounded-full"></div>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <i className="bx bx-search absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews by company name..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <i className="bx bx-x text-xl"></i>
                </button>
              )}
            </div>
            {debouncedSearch && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
                Showing results for "<span className="font-medium text-slate-700 dark:text-slate-200">{debouncedSearch}</span>"
                {pagination.totalReviews !== undefined && ` — ${pagination.totalReviews} review${pagination.totalReviews !== 1 ? "s" : ""} found`}
              </p>
            )}
          </div>

          {/* Reviews Grid */}
          {reviews.length === 0 && debouncedSearch ? (
            <div className="text-center py-16">
              <i className="bx bx-search-alt text-5xl text-slate-300 dark:text-slate-600 mb-4"></i>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No reviews found</h3>
              <p className="text-slate-500 dark:text-slate-400">No reviews match \"{debouncedSearch}\". Try a different company name.</p>
              <button onClick={() => setSearchQuery("")} className="mt-4 text-brand-500 hover:text-brand-700 font-medium">Clear search</button>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-slate-100 dark:border-slate-700">

                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={review.userImage}
                        alt={review.user}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/100?text=User";
                        }}
                      />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{review.user}</p>
                        <p className="text-sm text-slate-400">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                    {review.title}
                  </h3>

                  <div className="text-slate-500 dark:text-slate-400 leading-relaxed mb-4 text-sm">
                    <p>
                      {truncateText(review.comment)}
                      {needsTruncation(review.comment) && (
                        <>
                          <span>...</span>
                          <Link
                            to={`/review/${review._id}`}
                            className="text-brand-500 hover:text-brand-700 font-medium ml-2"
                          >
                            Read More
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Company Reply */}
                {review.hasReply && review.companyReply && (
                  <div className="mx-6 mb-4 p-3 bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="bx bx-buildings text-brand-500 text-sm"></i>
                      <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">Company Reply</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {review.companyReply.length > 120 ? (
                        <>
                          {review.companyReply.slice(0, 120)}...
                          <Link to={\`/review/\${review._id}\`} className="text-brand-500 hover:text-brand-700 font-medium ml-1">Read More</Link>
                        </>
                      ) : review.companyReply}
                    </p>
                  </div>
                )}

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                  <Link
                    to={review.url}
                    className="flex items-center gap-3 hover:bg-slate-100 rounded-lg p-2 -m-2 transition-colors"
                  >
                    <img
                      src={review.companyImage}
                      alt={review.company}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-600"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150?text=Logo";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{review.company}</p>
                      <p className="text-sm text-slate-400">{review.category}</p>
                    </div>
                    <i className="bx bx-chevron-right text-xl text-slate-400"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={!pagination.hasPrevPage}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm text-slate-600 dark:text-slate-300"
              >
                Previous
              </button>

              <div className="flex items-center gap-1.5">
                {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = index + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = index + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNumber = pagination.totalPages - 4 + index;
                  } else {
                    pageNumber = currentPage - 2 + index;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-10 h-10 rounded-xl font-medium text-sm transition-colors ${
                        currentPage === pageNumber
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, pagination.totalPages))}
                disabled={!pagination.hasNextPage}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm text-slate-600 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center mt-16 py-10 rounded-2xl shadow-sm bg-gradient-to-br from-brand-50 to-coral-50 border border-slate-100 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {localStorage.getItem("token") ? "Share Your Voice" : "Join Our Community"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {pagination.totalReviews} reviews and counting from real customers
            </p>
            <Link
              to={localStorage.getItem("token") ? "/categories" : "/register"}
              className="inline-flex items-center px-7 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-semibold text-sm"
            >
              {localStorage.getItem("token") ? "Find a Company to Review" : "Share Your Experience"}
              <i className="bx bx-right-arrow-alt ml-1 text-lg"></i>
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
};

export default BrowseReviews;
