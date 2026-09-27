import { API_BASE_URL } from "../config.js";
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "./Header.jsx";
import Footer from "../components/Footer.jsx";
import Loader from "../components/Loader.jsx";
import StarRating from "../components/StarRatings.jsx";
import { useToast } from "../components/Toast.jsx";

export default function CompanyDashboard() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  // Core state
  const showToast = useToast();
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Reviews pagination and sort
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState("");

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    description: "",
    url: "",
    logo: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch company info, stats, and reviews
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const headers = { headers: getAuthHeaders() };

        // Fetch stats and reviews in parallel
        const [statsRes, reviewsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/company-dashboard/${companyId}/stats`, headers),
          axios.get(`${API_BASE_URL}/company-dashboard/${companyId}/reviews?sort=${reviewSort}&page=${reviewPage}&limit=10`, headers),
        ]);

        setStats(statsRes.data);
        setReviews(reviewsRes.data.reviews);
        setTotalReviewPages(reviewsRes.data.totalPages);

        // Get company details from the first review or from a separate call
        if (reviewsRes.data.reviews.length > 0) {
          const firstReview = reviewsRes.data.reviews[0];
          // We need the company object - let's fetch it
          const companyRes = await axios.get(`${API_BASE_URL}/companies/by-id/${companyId}`);
          setCompany(companyRes.data);
          setProfileForm({
            description: companyRes.data.description || "",
            url: companyRes.data.url || "",
            logo: companyRes.data.logo || "",
          });
        } else {
          // No reviews - still get company data
          const companyRes = await axios.get(`${API_BASE_URL}/companies/by-id/${companyId}`);
          setCompany(companyRes.data);
          setProfileForm({
            description: companyRes.data.description || "",
            url: companyRes.data.url || "",
            logo: companyRes.data.logo || "",
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Dashboard load error:", err);
        if (err.response?.status === 403) {
          setError("You don't have access to this company's dashboard. You need an approved claim first.");
        } else {
          setError("Failed to load dashboard data.");
        }
        setLoading(false);
      }
    };

    fetchAll();
  }, [companyId, reviewSort, reviewPage]);

  // Reply to a review
  const handleReply = async (reviewId) => {
    if (!replyContent.trim()) return;
    setReplyLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/company-dashboard/${companyId}/reviews/${reviewId}/reply`,
        { content: replyContent },
        { headers: getAuthHeaders() }
      );
      // Update the review in state with the new reply
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, reply: res.data.reply } : r
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

  // Edit a reply
  const handleEditReply = async (reviewId) => {
    if (!editReplyContent.trim()) return;
    setReplyLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/company-dashboard/${companyId}/reviews/${reviewId}/reply`,
        { content: editReplyContent },
        { headers: getAuthHeaders() }
      );
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, reply: res.data.reply } : r
        )
      );
      setEditingReply(null);
      setEditReplyContent("");
    } catch (err) {
      console.error("Edit reply error:", err);
      showToast("Failed to update reply", "error");
    } finally {
      setReplyLoading(false);
    }
  };

  // Delete a reply
  const handleDeleteReply = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/company-dashboard/${companyId}/reviews/${reviewId}/reply`,
        { headers: getAuthHeaders() }
      );
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, reply: null } : r
        )
      );
    } catch (err) {
      console.error("Delete reply error:", err);
      showToast("Failed to delete reply", "error");
    }
  };

  // Save company profile
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/company-dashboard/${companyId}/profile`,
        profileForm,
        { headers: getAuthHeaders() }
      );
      setCompany((prev) => ({ ...prev, ...profileForm }));
      setEditMode(false);
      showToast("Company profile updated!", "success");
    } catch (err) {
      console.error("Profile save error:", err);
      showToast("Failed to update profile", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader message="Loading Dashboard..." />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-900/50 p-8 max-w-md text-center border border-slate-200 dark:border-slate-600">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="bx bx-lock-alt text-red-500 dark:text-red-400 text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Access Denied</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/"
                className="px-5 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold"
              >
                Go Home
              </Link>
              <Link
                to="/profile"
                className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-semibold"
              >
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const ratingColor = (rating) => {
    if (rating >= 4) return "text-green-500";
    if (rating >= 3) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Dashboard Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-900/50 p-6 mb-6 border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <img
                src={company?.logo || "https://via.placeholder.com/80?text=Co"}
                alt={company?.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-600"
                onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=Co"; }}
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{company?.name}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{company?.category?.name || "General"}</p>
                <Link
                  to={`/company/${company?.slug}`}
                  className="text-brand-500 hover:text-brand-600 text-sm inline-flex items-center mt-1"
                >
                  <i className="bx bx-link-external mr-1"></i> View Public Page
                </Link>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${ratingColor(stats?.avgRating || 0)}`}>
                  {stats?.avgRating || "—"}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  {stats?.totalReviews || 0} reviews
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 p-1">
            {[
              { id: "overview", label: "Overview", icon: "bx-bar-chart-alt-2" },
              { id: "reviews", label: "Reviews", icon: "bx-chat" },
              { id: "profile", label: "Edit Profile", icon: "bx-edit" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-sm ${
                  activeTab === tab.id
                    ? "bg-brand-500 text-white shadow-md dark:shadow-slate-900/40"
                    : "text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700"
                }`}
              >
                <i className={`bx ${tab.icon} mr-1`}></i> {tab.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 text-center">
                  <div className="text-3xl font-bold text-brand-500">{stats.totalReviews}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Total Reviews</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 text-center">
                  <div className={`text-3xl font-bold ${ratingColor(stats.avgRating)}`}>{stats.avgRating}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Avg Rating</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 text-center">
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.recentReviewCount}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Last 30 Days</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 text-center">
                  <div className="text-3xl font-bold text-coral-500">{stats.replyRate}%</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Reply Rate</div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Rating Distribution</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.ratingDistribution?.[star] || 0;
                    const pct = stats.totalReviews > 0 ? ((count / stats.totalReviews) * 100).toFixed(0) : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-12 text-sm font-medium text-slate-700 dark:text-slate-200">
                          {star} <i className="bx bxs-star text-amber-400 text-xs"></i>
                        </div>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-right text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{count} ({pct}%)</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              {/* Sort Controls */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  All Reviews ({stats?.totalReviews || 0})
                </h3>
                <select
                  value={reviewSort}
                  onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:border-brand-500 outline-none dark:bg-slate-700"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 text-center">
                  <i className="bx bx-conversation text-slate-300 dark:text-slate-400 dark:text-slate-500 text-5xl mb-3"></i>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No reviews yet</h3>
                  <p className="text-slate-500 dark:text-slate-400">Reviews from customers will appear here.</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={review.user?.profileImage || "https://via.placeholder.com/40?text=U"}
                          alt={review.user?.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                          onError={(e) => { e.target.src = "https://via.placeholder.com/40?text=U"; }}
                        />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{review.user?.name || "Anonymous"}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString("en-US", {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <StarRating rating={review.rating} />
                      </div>
                    </div>

                    {/* Review Body */}
                    {review.title && (
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{review.title}</h4>
                    )}
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{review.comment}</p>

                    {/* Existing Company Reply */}
                    {review.reply && editingReply !== review._id && (
                      <div className="bg-brand-50 border border-brand-100 dark:border-brand-500/30 rounded-lg p-4 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <i className="bx bx-buildings text-brand-500"></i>
                            <span className="font-semibold text-brand-700 dark:text-brand-300 text-sm">Company Reply</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingReply(review._id);
                                setEditReplyContent(review.reply.content);
                              }}
                              className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-brand-600"
                            >
                              <i className="bx bx-edit"></i> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReply(review._id)}
                              className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-red-600"
                            >
                              <i className="bx bx-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 text-sm">{review.reply.content}</p>
                      </div>
                    )}

                    {/* Edit Reply Form */}
                    {editingReply === review._id && (
                      <div className="mt-3 space-y-3">
                        <textarea
                          value={editReplyContent}
                          onChange={(e) => setEditReplyContent(e.target.value)}
                          rows="3"
                          className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:border-brand-500 outline-none dark:bg-slate-700 resize-none text-slate-800 dark:text-slate-100"
                          placeholder="Edit your reply..."
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setEditingReply(null); setEditReplyContent(""); }}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditReply(review._id)}
                            disabled={replyLoading}
                            className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 font-semibold"
                          >
                            {replyLoading ? "Saving..." : "Save Edit"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reply Button / Form */}
                    {!review.reply && editingReply !== review._id && (
                      <>
                        {replyingTo === review._id ? (
                          <div className="mt-3 space-y-3">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows="3"
                              maxLength={1000}
                              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:border-brand-500 outline-none dark:bg-slate-700 resize-none text-slate-800 dark:text-slate-100"
                              placeholder="Write a professional reply to this review..."
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">{replyContent.length}/1000</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleReply(review._id)}
                                  disabled={replyLoading || replyContent.length < 5}
                                  className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 font-semibold"
                                >
                                  {replyLoading ? "Posting..." : "Post Reply"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyingTo(review._id)}
                            className="mt-2 text-sm text-brand-500 hover:text-brand-600 font-medium"
                          >
                            <i className="bx bx-reply mr-1"></i> Reply to this review
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}

              {/* Pagination */}
              {totalReviewPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <button
                    onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                    disabled={reviewPage === 1}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                    Page {reviewPage} of {totalReviewPages}
                  </span>
                  <button
                    onClick={() => setReviewPage((p) => Math.min(totalReviewPages, p + 1))}
                    disabled={reviewPage === totalReviewPages}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Company Profile</h3>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-semibold"
                  >
                    <i className="bx bx-edit mr-1"></i> Edit
                  </button>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                    <textarea
                      value={profileForm.description}
                      onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                      rows="4"
                      className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-brand-500 outline-none dark:bg-slate-700 resize-none text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Website URL</label>
                    <input
                      type="url"
                      value={profileForm.url}
                      onChange={(e) => setProfileForm({ ...profileForm, url: e.target.value })}
                      className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-brand-500 outline-none dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Company Logo</label>
                    
                    {/* Logo Preview */}
                    {profileForm.logo && (
                      <div className="mb-3 flex justify-center">
                        <img
                          src={profileForm.logo}
                          alt="Logo Preview"
                          className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-600"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </div>
                    )}

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={(e) => handleLogoUpload(e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Upload Button */}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="w-full p-3 border-2 border-dashed border-slate-300 dark:border-slate-500 dark:bg-slate-700/50 rounded-lg hover:border-brand-400 transition-colors duration-200 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 dark:text-slate-400 hover:text-brand-600 disabled:opacity-50"
                    >
                      {logoUploading ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="bx bx-camera text-lg"></i>
                          {profileForm.logo ? "Change Logo" : "Upload Logo"}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setProfileForm({
                          description: company?.description || "",
                          url: company?.url || "",
                          logo: company?.logo || "",
                        });
                      }}
                      className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="px-5 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 font-semibold"
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={company?.logo || "https://via.placeholder.com/64?text=Co"}
                      alt={company?.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-600"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/64?text=Co"; }}
                    />
                    <div>
                      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{company?.name}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{company?.category?.name || "General"}</p>
                    </div>
                  </div>
                  {company?.description && (
                    <div>
                      <label className="text-xs font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                      <p className="text-slate-700 dark:text-slate-200 mt-1">{company.description}</p>
                    </div>
                  )}
                  {company?.url && (
                    <div>
                      <label className="text-xs font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website</label>
                      <a href={company.url.startsWith("http") ? company.url : `https://${company.url}`} target="_blank" rel="noreferrer" className="text-brand-500 hover:text-brand-600 block mt-1">
                        {company.url}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
