import { useState } from "react";
import api from "../api.js";

/**
 * Shared hook for company reply operations (post, edit, delete).
 * Used by CompanyReviewsList (public page) and DashboardReviews (company dashboard).
 *
 * @param {string} companyId - The company's ID for API calls
 * @param {Function} setReviews - State setter to update the reviews array
 * @param {Function} showToast - Toast notification function
 * @param {string} replyField - Key name for the reply in the review object ("reply" or "companyReply")
 */
export default function useCompanyReply(companyId, setReviews, showToast, replyField = "reply") {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState("");

  const handleReply = async (reviewId) => {
    if (!replyContent.trim() || replyContent.length < 5) return;
    setReplyLoading(true);
    try {
      const res = await api.post(
        `/company-dashboard/${companyId}/reviews/${reviewId}/reply`,
        { content: replyContent }
      );
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, [replyField]: res.data.reply } : r))
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
        `/company-dashboard/${companyId}/reviews/${reviewId}/reply`,
        { content: editReplyContent }
      );
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, [replyField]: res.data.reply } : r))
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
        `/company-dashboard/${companyId}/reviews/${reviewId}/reply`
      );
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, [replyField]: null } : r))
      );
    } catch (err) {
      console.error("Delete reply error:", err);
      showToast("Failed to delete reply", "error");
    }
  };

  const startReply = (reviewId) => {
    setReplyingTo(reviewId);
    setReplyContent("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const startEditReply = (reviewId, currentContent) => {
    setEditingReply(reviewId);
    setEditReplyContent(currentContent);
  };

  const cancelEditReply = () => {
    setEditingReply(null);
    setEditReplyContent("");
  };

  return {
    replyingTo,
    replyContent,
    setReplyContent,
    replyLoading,
    editingReply,
    editReplyContent,
    setEditReplyContent,
    handleReply,
    handleEditReply,
    handleDeleteReply,
    startReply,
    cancelReply,
    startEditReply,
    cancelEditReply,
  };
}
