import api, { API_BASE_URL } from "../api.js";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useLocation} from "react-router-dom";
import ReviewBox from "../components/ReviewBox";
import ReviewForm from "../components/ReviewForm";
import StarRating from "../components/StarRatings";
import Loader from "../components/Loader";
import Header from "../pages/Header";
import Footer from "../components/Footer.jsx";
import CompanyLogo from "../components/CompanyLogo";
import { useToast } from "../components/Toast.jsx";
import ScrollDots from "../components/ScrollDots.jsx";
import "../styles/ReviewsText.css";

export default function CompanyPage() {
  const { slug } = useParams();
  const location = useLocation();
  const showToast = useToast();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(location.search.includes('openReview=true'));

  // Claim state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimForm, setClaimForm] = useState({ role: "owner", reason: "", jobTitle: "" });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null); // null, "pending", "approved", "none"
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Reply state (for company admins)
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // User review actions state
  const [editingReview, setEditingReview] = useState(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [userReplyingTo, setUserReplyingTo] = useState(null);
  const [userReplyContent, setUserReplyContent] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (location.search.includes('openReview=true')) {
      setShowReviewForm(true);
      window.history.replaceState({}, '', `/company/${slug}`);
    }
  }, [location, slug]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyRes = await api.get(`${API_BASE_URL}/companies/slug/${slug}`);
        setCompany(companyRes.data);

        // Fetch reviews and claims in parallel (both depend on company ID, not each other)
        const token = localStorage.getItem("token");
        const [reviewsRes, claimsRes] = await Promise.all([
          api.get(`${API_BASE_URL}/reviews/company/${companyRes.data._id}/with-replies`),
          token
            ? api.get(`${API_BASE_URL}/company-claims/my-claims`, {
                headers: { Authorization: `Bearer ${token}` },
              }).catch(() => null)
            : Promise.resolve(null)
        ]);

        const mappedReviews = reviewsRes.data.map((review) => ({
          _id: review._id,
          title: review.title || "Review",
          comment: review.comment,
          rating: review.rating,
          user: review.user?.name || "Anonymous",
          image: review.user?.profileImage || "/default-avatar.svg",
          date: new Date(review.createdAt).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          }),
          company: review.company.name,
          url: `/company/${review.company.slug}`,
          companyimage: review.company.logo || "",
          category: review.company.category?.name || "General",
          createdAt: review.createdAt,
          companyReply: review.companyReply || null,
          userId: review.user?._id || null,
          userReply: review.userReply || null
        }));

        setReviews(mappedReviews);

        // Process claims result
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
       
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const handleReviewAdded = (newReview) => {
    setReviews([newReview, ...reviews]);
    setShowReviewForm(false);
  };

  const handleSubmitClaim = async () => {
    if (!claimForm.reason.trim()) {
      showToast("Please provide a reason for your claim.", "warning");
      return;
    }
    setClaimLoading(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `${API_BASE_URL}/company-claims`,
        {
          companyId: company._id,
          role: claimForm.role,
          reason: claimForm.reason,
          jobTitle: claimForm.jobTitle,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClaimStatus("pending");
      setShowClaimModal(false);
      setClaimForm({ role: "owner", reason: "", jobTitle: "" });
    } catch (err) {
      console.error("Claim error:", err);
      showToast(err.response?.data?.message || "Failed to submit claim", "error");
    } finally {
      setClaimLoading(false);
    }
  };

  // Reply to a review (company admin on public page)
  const handleReply = async (reviewId) => {
    if (!replyContent.trim() || replyContent.length < 5) return;
    setReplyLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `${API_BASE_URL}/company-dashboard/${company._id}/reviews/${reviewId}/reply`,
        { content: replyContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update the review in state with the new reply
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, companyReply: res.data.reply } : r
        )
      );
      setReplyingTo(null);
      setReplyContent("");
    } catch (err) {
      console.error("Reply error:", err);
      showToast(err.response?.data?.error || "Failed to post reply", "error");
    } finally {
      setReplyLoading(false);
    }
  };

  // Current user for review ownership checks
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const handleEditReview = async (reviewId) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `${API_BASE_URL}/reviews/${reviewId}`,
        { comment: editComment, rating: editRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, comment: editComment, rating: editRating } : r));
      setEditingReview(null);
      showToast("Review updated!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to update review", "error");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`${API_BASE_URL}/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      showToast("Review deleted", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete review", "error");
    }
  };

  const handleUserReply = async (reviewId) => {
    if (!userReplyContent.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `${API_BASE_URL}/reviews/${reviewId}/user-reply`,
        { content: userReplyContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, userReply: res.data } : r));
      setUserReplyingTo(null);
      setUserReplyContent("");
      showToast("Reply posted!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to post reply", "error");
    }
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
              {/* Company Logo */}
              <CompanyLogo
                logo={company.logo}
                url={company.url}
                name={company.name || "Company"}
                size={120}
              />

              {/* Company Info */}
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

                {/* Google Places Info */}
                {company.source === "google" && (
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                      <img src="https://www.google.com/favicon.ico" alt="" className="w-3 h-3" />
                      Imported from Google
                    </span>
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
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
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

            {/* Claim / Dashboard Button */}
            {isLoggedIn && claimStatus === "approved" && (
              <Link
                to={`/company-dashboard/${company._id}`}
                className="flex-1 py-3 px-6 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors duration-200 text-center"
              >
                <i className="bx bx-tachometer mr-1"></i> Dashboard
              </Link>
            )}
            {isLoggedIn && claimStatus === "pending" && (
              <div className="flex-1 py-3 px-6 rounded-xl font-semibold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-center cursor-default">
                <i className="bx bx-time-five mr-1"></i> Claim Pending
              </div>
            )}
            {isLoggedIn && claimStatus === "none" && (
              <button
                onClick={() => setShowClaimModal(true)}
                className="flex-1 py-3 px-6 rounded-xl font-semibold bg-coral-500 text-white hover:bg-coral-600 transition-colors duration-200"
              >
                <i className="bx bx-badge-check mr-1"></i> Claim This Company
              </button>
            )}
            {!isLoggedIn && (
              <Link
                to={`/register-business?claim=${encodeURIComponent(company.name)}&companyId=${company._id}&url=${encodeURIComponent(company.website || "")}`}
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                <i className="bx bx-chat text-brand-500 mr-2"></i>
                What people say about {company.name}
              </h2>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="bx bx-conversation text-slate-400 text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No reviews yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Be the first to share your experience with {company.name}!</p>
                <button onClick={() => setShowReviewForm(true)} className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200 font-semibold">
                  Write the First Review
                </button>
              </div>
            ) : (
              <>
                {/* Review Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter(r => r.rating === stars).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length * 100).toFixed(0) : 0;
                    return (
                      <div key={stars} className="text-center">
                        <div className="text-sm text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-center">
                          {stars} <StarRating rating={stars} />
                        </div>
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{count}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">({percentage}%)</div>
                      </div>
                    );
                  })}
                </div>

                {/* Reviews List */}
                <div className="reviews">
                  <div className="reviewscomments-row" ref={scrollRef}>
                    {reviews.map((review, index) => (
                      <div key={review._id || index}>
                        <ReviewBox
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
                          category={review.category}
                        />

                        {/* Show existing company reply */}
                        {review.companyReply && (
                          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="bx bx-buildings text-green-600 dark:text-green-400 text-lg"></i>
                              <span className="font-semibold text-green-700 dark:text-green-400 text-sm">
                                {company.name} replied
                              </span>
                              <span className="text-slate-400 dark:text-slate-500 text-xs ml-auto">
                                {new Date(review.companyReply.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric", month: "short", day: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed m-0">
                              {review.companyReply.content}
                            </p>
                          </div>
                        )}

                        {/* Reply button for company admins (only if no reply yet) */}
                        {claimStatus === "approved" && !review.companyReply && (
                          <>
                            {replyingTo === review._id ? (
                              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4 mb-4">
                                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-2">
                                  <i className="bx bx-reply mr-1"></i>
                                  Reply as {company.name}
                                </p>
                                <textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  rows="3"
                                  maxLength={1000}
                                  placeholder="Write a professional reply to this review..."
                                  className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg text-sm resize-none outline-none text-slate-700 dark:text-slate-200 box-border"
                                />
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-slate-400 dark:text-slate-500">{replyContent.length}/1000</span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                                      className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none rounded-lg cursor-pointer font-semibold hover:bg-slate-200 dark:hover:bg-slate-600"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleReply(review._id)}
                                      disabled={replyLoading || replyContent.length < 5}
                                      className={`px-4 py-2 text-sm text-white border-none rounded-lg font-semibold ${replyLoading || replyContent.length < 5 ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer'}`}
                                    >
                                      {replyLoading ? "Posting..." : "Post Reply"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-4">
                                <button
                                  onClick={() => setReplyingTo(review._id)}
                                  className="bg-transparent border-none text-green-600 dark:text-green-400 font-semibold text-sm cursor-pointer py-1 px-0 hover:text-green-700 dark:hover:text-green-300"
                                >
                                  <i className="bx bx-reply mr-1"></i>
                                  Reply to this review
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {/* Existing user reply to company response */}
                        {review.userReply && (
                          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <i className="bx bx-user text-blue-500"></i>
                              <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Author's Reply</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed m-0">{review.userReply.content}</p>
                          </div>
                        )}

                        {/* User Actions — only for review author */}
                        {currentUser._id && review.userId === currentUser._id && (
                          <div className="flex items-center gap-3 mb-4 pt-2">
                            {editingReview !== review._id && (
                              <>
                                <button onClick={() => { setEditingReview(review._id); setEditComment(review.comment); setEditRating(review.rating); }}
                                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1 bg-transparent border-none cursor-pointer">
                                  <i className="bx bx-edit"></i> Edit
                                </button>
                                <button onClick={() => handleDeleteReview(review._id)}
                                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 flex items-center gap-1 bg-transparent border-none cursor-pointer">
                                  <i className="bx bx-trash"></i> Delete
                                </button>
                                {review.companyReply && !review.userReply && (
                                  <button onClick={() => { setUserReplyingTo(review._id); setUserReplyContent(""); }}
                                    className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 bg-transparent border-none cursor-pointer">
                                    <i className="bx bx-reply"></i> Reply to Company
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Inline edit form */}
                        {editingReview === review._id && (
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4 mb-4 space-y-3">
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(star => (
                                <button key={star} type="button" onClick={() => setEditRating(star)}
                                  className={"text-2xl bg-transparent border-none cursor-pointer " + (star <= editRating ? "text-yellow-400" : "text-slate-300 dark:text-slate-600")}>&#9733;</button>
                              ))}
                            </div>
                            <textarea value={editComment} onChange={e => setEditComment(e.target.value)}
                              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm resize-none outline-none box-border" rows="4" />
                            <div className="flex gap-2">
                              <button onClick={() => handleEditReview(review._id)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 border-none cursor-pointer">Save</button>
                              <button onClick={() => setEditingReview(null)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 bg-transparent cursor-pointer">Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* User reply form */}
                        {userReplyingTo === review._id && (
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4 mb-4 space-y-2">
                            <textarea value={userReplyContent} onChange={e => setUserReplyContent(e.target.value)}
                              placeholder="Reply to the company's response..." rows="3"
                              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm resize-none outline-none box-border" />
                            <div className="flex gap-2">
                              <button onClick={() => handleUserReply(review._id)} disabled={!userReplyContent.trim()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Post Reply</button>
                              <button onClick={() => setUserReplyingTo(null)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-300 bg-transparent cursor-pointer">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Scroll Dots for mobile */}
                <ScrollDots scrollRef={scrollRef} itemCount={reviews.length} />
              </>
            )}
          </div>

          {/* Google Reviews Section */}
          {company.googleReviews && company.googleReviews.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8 mt-8 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reviews from Google</h2>
                {company.googleRating && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-2xl font-bold text-amber-500">{company.googleRating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < Math.round(company.googleRating) ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}>{"★"}</span>
                      ))}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      ({company.googleReviewCount?.toLocaleString() || 0} reviews on Google)
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-4 py-2 mb-6 text-sm text-amber-800 dark:text-amber-300">
                These reviews are sourced from Google and may not reflect the views of TrustPilot.Africa users.
              </div>

              <div className="space-y-6">
                {company.googleReviews.map((review, index) => (
                  <div key={index} className="border-b border-slate-100 dark:border-slate-700 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      <img
                        src={review.profilePhotoUrl || '/default-avatar.svg'}
                        alt={review.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                        onError={(e) => { e.target.src = '/default-avatar.svg'; }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100">{review.authorName}</h4>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{review.relativeTimeDescription}</span>
                        </div>
                        <div className="flex mb-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < review.rating ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}>{"★"}</span>
                          ))}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{review.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4" style={{ zIndex: 200 }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                <i className="bx bx-badge-check text-brand-500 mr-2"></i>
                Claim {company.name}
              </h2>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Claiming this company lets you respond to reviews, see analytics, and update your company profile. An admin will review your claim.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Role</label>
                <select
                  value={claimForm.role}
                  onChange={(e) => setClaimForm({ ...claimForm, role: e.target.value })}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:border-brand-500 outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="representative">Representative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title (optional)</label>
                <input
                  type="text"
                  value={claimForm.jobTitle}
                  onChange={(e) => setClaimForm({ ...claimForm, jobTitle: e.target.value })}
                  placeholder="e.g. CEO, Marketing Manager"
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:border-brand-500 outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Why are you claiming this company? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={claimForm.reason}
                  onChange={(e) => setClaimForm({ ...claimForm, reason: e.target.value })}
                  rows="3"
                  placeholder="Explain your relationship with this company..."
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:border-brand-500 outline-none resize-none text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowClaimModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitClaim}
                disabled={claimLoading || !claimForm.reason.trim()}
                className="flex-1 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 font-semibold"
              >
                {claimLoading ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
