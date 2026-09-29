import { useState } from "react";
import api, { API_BASE_URL } from "../../api.js";
import StarRating from "../StarRatings.jsx";
import { useToast } from "../Toast.jsx";

export default function DashboardReviews({ companyId, stats, reviews, setReviews, reviewSort, setReviewSort, reviewPage, setReviewPage, totalReviewPages }) {
  const showToast = useToast();

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const handleReply = async (reviewId) => {
    if (!replyContent.trim()) return;
    setReplyLoading(true);
    try {
      const res = await api.post(
        `${API_BASE_URL}/company-dashboard/${companyId}/reviews/${reviewId}/reply`,
        { content: replyContent },
        { headers: getAuthHeaders() }
      );
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, reply: res.data.reply } : r))
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

  const handleEditReply = async (reviewId) => {
    if (!editReplyContent.trim()) return;
    setReplyLoading(true);
    try {
      const res = await api.put(
        `${API_BASE_URL}/company-dashboard/${companyId}/reviews/${reviewId}/reply`,
        { content: editReplyContent },
        { headers: getAuthHeaders() }
      );
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, reply: res.data.reply } : r))
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

  const handleDeleteReply = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      await api.delete(
        `${API_BASE_URL}/company-dashboard/${companyId}/reviews/${reviewId}/reply`,
        { headers: getAuthHeaders() }
      );
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, reply: null } : r))
      );
    } catch (err) {
      console.error("Delete reply error:", err);
      showToast("Failed to delete reply", "error");
    }
  };

  return (
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
          <i className="bx bx-conversation text-slate-300 dark:text-slate-500 text-5xl mb-3"></i>
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
                  src={review.user?.profileImage || "/default-avatar.svg"}
                  alt={review.user?.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                  onError={(e) => { e.target.src = "/default-avatar.svg"; }}
                />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{review.user?.name || "Anonymous"}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
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
              <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/30 rounded-lg p-4 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <i className="bx bx-buildings text-brand-500"></i>
                    <span className="font-semibold text-brand-700 dark:text-brand-300 text-sm">Company Reply</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingReply(review._id); setEditReplyContent(review.reply.content); }}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-brand-600"
                    >
                      <i className="bx bx-edit"></i> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReply(review._id)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600"
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
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
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
                      <span className="text-xs text-slate-400 dark:text-slate-500">{replyContent.length}/1000</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                          className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
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
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
            Page {reviewPage} of {totalReviewPages}
          </span>
          <button
            onClick={() => setReviewPage((p) => Math.min(totalReviewPages, p + 1))}
            disabled={reviewPage === totalReviewPages}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
