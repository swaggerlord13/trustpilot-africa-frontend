import { useState, useRef } from "react";
import api, { API_BASE_URL } from "../../api.js";
import ReviewBox from "../ReviewBox";
import StarRating from "../StarRatings";
import ScrollDots from "../ScrollDots.jsx";
import { useToast } from "../Toast.jsx";
import { useAuth } from "../AuthProvider.jsx";

export default function CompanyReviewsList({ company, reviews, setReviews, claimStatus }) {
  const showToast = useToast();
  const scrollRef = useRef(null);

  // Company admin reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // User review actions state
  const [editingReview, setEditingReview] = useState(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [userReplyingTo, setUserReplyingTo] = useState(null);
  const [userReplyContent, setUserReplyContent] = useState("");

  const { user: currentUser, token } = useAuth();

  const handleReply = async (reviewId) => {
    if (!replyContent.trim() || replyContent.length < 5) return;
    setReplyLoading(true);
    try {
      // token from useAuth
      const res = await api.post(
        `${API_BASE_URL}/company-dashboard/${company._id}/reviews/${reviewId}/reply`,
        { content: replyContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, companyReply: res.data.reply } : r))
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

  const handleEditReview = async (reviewId) => {
    try {
      // token from useAuth
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
      // token from useAuth
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
      // token from useAuth
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

  return (
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

                  {/* Existing company reply */}
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

                  {/* Reply button for company admins */}
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

                  {/* Existing user reply */}
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
                  {currentUser?._id && review.userId === currentUser._id && (
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
          <ScrollDots scrollRef={scrollRef} itemCount={reviews.length} />
        </>
      )}
    </div>
  );
}
