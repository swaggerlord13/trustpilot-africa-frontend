import api from "../api.js";
import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import ReviewForm from "../components/ReviewForm";
import StarRating from "../components/StarRatings";
import Loader from "../components/Loader";
import Header from "../pages/Header";
import Footer from "../components/Footer.jsx";
import CompanyLogo from "../components/CompanyLogo";
import { useToast } from "../components/Toast.jsx";
import CompanyClaimModal from "../components/company/CompanyClaimModal.jsx";
import CompanyReviewsList from "../components/company/CompanyReviewsList.jsx";
import CompanyGoogleReviews from "../components/company/CompanyGoogleReviews.jsx";
import "../styles/ReviewsText.css";
import { useAuth } from "../components/AuthProvider.jsx";

export default function CompanyPage() {
  const { slug } = useParams();
  const location = useLocation();
  const showToast = useToast();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(location.search.includes('openReview=true'));
  const [sortBy, setSortBy] = useState("newest");
  const [pagination, setPagination] = useState(null);

  // Claim state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (location.search.includes('openReview=true')) {
      setShowReviewForm(true);
      window.history.replaceState({}, '', `/company/${slug}`);
    }
  }, [location, slug]);

  const mapReviews = (rawReviews) =>
    rawReviews.map((review) => ({
      _id: review._id,
      title: review.title || "Review",
      comment: review.comment,
      rating: review.rating,
      user: review.user?.name || "Anonymous",
      image: review.user?.profileImage || "",
      date: new Date(review.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      }),
      company: review.company.name,
      url: `/company/${review.company.slug}`,
      companyimage: review.company.logo || "",
      companyUrl: review.company.url || "",
      category: review.company.category?.name || "General",
      createdAt: review.createdAt,
      companyReply: review.companyReply || null,
      userId: review.user?._id || null,
      userReply: review.userReply || null
    }));

  const fetchReviews = useCallback(async (companyData, sort, page, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const reviewsRes = await api.get(
        `/reviews/company/${companyData._id}/with-replies?sort=${sort}&page=${page}&limit=20`
      );

      const mapped = mapReviews(reviewsRes.data.reviews);

      if (append) {
        setReviews((prev) => [...prev, ...mapped]);
      } else {
        setReviews(mapped);
      }
      setPagination(reviewsRes.data.pagination);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyRes = await api.get(`/companies/slug/${slug}`);
        setCompany(companyRes.data);

        const [_, claimsRes] = await Promise.all([
          fetchReviews(companyRes.data, "newest", 1),
          isLoggedIn
            ? api.get("/company-claims/my-claims").catch(() => null)
            : Promise.resolve(null)
        ]);

        if (claimsRes) {
          const claimsArray = Array.isArray(claimsRes.data) ? claimsRes.data : [];
          const companyClaim = claimsArray.find(
            (c) => c.company?._id === companyRes.data._id || c.company === companyRes.data._id
          );
          setClaimStatus(companyClaim ? companyClaim.status : "none");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching company or reviews:", err);
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug, fetchReviews]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    if (company) fetchReviews(company, newSort, 1);
  };

  const handleLoadMore = () => {
    if (company && pagination?.hasMore) {
      fetchReviews(company, sortBy, pagination.page + 1, true);
    }
  };

  const handleReviewAdded = (newReview) => {
    setReviews([newReview, ...reviews]);
    setShowReviewForm(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const getRatingColor = (rating) => {
    const numRating = parseFloat(rating);
    if (numRating <= 2) return "text-red-500";
    if (numRating === 3) return "text-yellow-500";
    return "text-green-500";
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader message="Loading Company Details..." />
        </div>
      </>
    );
  }

  if (!company) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto p-6 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bx bx-buildings text-slate-400 text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Company Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">The company you're looking for doesn't exist or may have been removed.</p>
          <Link to="/categories" className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200 font-semibold">
            <i className="bx bx-search mr-1"></i> Browse All Companies
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="text-sm text-slate-500 dark:text-slate-400">
              <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/categories" className="hover:text-brand-500 transition-colors">Categories</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">{company.name}</span>
            </nav>
          </div>

          {/* Company Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8 border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <CompanyLogo logo={company.logo} url={company.url} name={company.name || "Company"} size={120} />

              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">{company.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">
                    <i className="bx bx-category mr-1"></i> {company.category?.name || "General"}
                  </span>
                  {company.subcategory && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                      <i className="bx bx-folder mr-1"></i> {company.subcategory.name}
                    </span>
                  )}
                </div>
                {company.description && (
                  <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{company.description}</p>
                )}
                {company.url && (
                  <a
                    href={company.url.startsWith('http') ? company.url : `https://${company.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200 font-semibold"
                  >
                    <i className="bx bx-globe mr-2"></i> Visit Website
                  </a>
                )}
                {(company.source === "google" || company.address || company.phone || company.country) && (
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {company.source === "google" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                        <img src="https://www.google.com/favicon.ico" alt="" className="w-3 h-3" />
                        Imported from Google
                      </span>
                    )}
                    {company.address && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <i className="bx bx-map"></i> {company.address}
                      </span>
                    )}
                    {company.phone && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <i className="bx bx-phone"></i> {company.phone}
                      </span>
                    )}
                    {company.country && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-coral-50 dark:bg-coral-500/20 text-coral-600 dark:text-coral-300 border border-coral-200 dark:border-coral-500/30">
                        <i className="bx bx-world"></i> {company.country}{company.city ? ', ' + company.city : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Rating Summary */}
              <div className="text-center md:text-right">
                <div className={`text-4xl font-bold mb-1 ${getRatingColor(avgRating)}`}>
                  {avgRating > 0 ? avgRating : "—"}
                </div>
                {avgRating > 0 ? (
                  <div className="mb-2"><StarRating rating={Math.round(parseFloat(avgRating))} /></div>
                ) : (
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (<span key={i} className="text-xl text-slate-300 dark:text-slate-600">{"★"}</span>))}
                  </div>
                )}
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Based on {pagination?.total ?? reviews.length} review{(pagination?.total ?? reviews.length) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-white transition-all duration-200 ${
                showReviewForm ? "bg-slate-400 hover:bg-slate-500" : "bg-brand-500 hover:bg-brand-600"
              }`}
            >
              {showReviewForm ? "Cancel Review" : "Write a Review"}
            </button>

            <Link
              to={`/categories/${company.category?.slug || 'general'}`}
              className="flex-1 py-3 px-6 rounded-xl font-semibold bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/30 transition-colors duration-200 text-center"
            >
              <i className="bx bx-search mr-1"></i> More in {company.category?.name || "Category"}
            </Link>

            {isLoggedIn && claimStatus === "approved" && (
              <Link to={`/company-dashboard/${company._id}`} className="flex-1 py-3 px-6 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors duration-200 text-center">
                <i className="bx bx-tachometer mr-1"></i> Dashboard
              </Link>
            )}
            {isLoggedIn && claimStatus === "pending" && (
              <div className="flex-1 py-3 px-6 rounded-xl font-semibold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-center cursor-default">
                <i className="bx bx-time-five mr-1"></i> Claim Pending
              </div>
            )}
            {isLoggedIn && claimStatus === "none" && (
              <button onClick={() => setShowClaimModal(true)} className="flex-1 py-3 px-6 rounded-xl font-semibold bg-coral-500 text-white hover:bg-coral-600 transition-colors duration-200">
                <i className="bx bx-badge-check mr-1"></i> Claim This Company
              </button>
            )}
            {!isLoggedIn && (
              <Link
                to={`/register-business?claim=${encodeURIComponent(company.name)}&companyId=${company._id}&url=${encodeURIComponent(company.url || "")}`}
                className="flex-1 py-3 px-6 rounded-xl font-semibold bg-coral-500 text-white hover:bg-coral-600 transition-colors duration-200 text-center"
              >
                <i className="bx bx-badge-check mr-1"></i> Claim This Business
              </Link>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <ReviewForm companyId={company._id} companyName={company.name} onReviewAdded={handleReviewAdded} />
          )}

          {/* Reviews Section */}
          <CompanyReviewsList
            company={company}
            reviews={reviews}
            setReviews={setReviews}
            claimStatus={claimStatus}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            pagination={pagination}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
          />

          {/* Google Reviews Section */}
          <CompanyGoogleReviews company={company} />

          {/* Related Companies */}
          {company.category && (
            <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                <i className="bx bx-buildings text-brand-500 mr-2"></i>
                More companies in {company.category.name}
              </h3>
              <Link
                to={`/categories/${company.category.slug || 'general'}`}
                className="inline-flex items-center px-4 py-2 bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/30 transition-colors duration-200 font-semibold"
              >
                Browse All <i className="bx bx-right-arrow-alt ml-1"></i>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && isLoggedIn && (
        <CompanyClaimModal
          company={company}
          onClose={() => setShowClaimModal(false)}
          onClaimSubmitted={(status) => setClaimStatus(status)}
        />
      )}

      <Footer />
    </>
  );
}
