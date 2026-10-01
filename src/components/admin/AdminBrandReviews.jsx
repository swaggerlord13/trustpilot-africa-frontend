import { useState, useEffect, useCallback, useRef } from "react";
import { adminApi, StarDisplay, formatDate, Pagination } from "./adminHelpers.jsx";
import { useToast } from "../Toast.jsx";
import Loader from "../Loader.jsx";

// Server page size for this list
const PAGE_SIZE = 20;

/**
 * Admin: every review of a whole brand, newest first, with a delete button
 * for spam or abuse. (Reviews of single locations are under "Reviews".)
 */
export default function AdminBrandReviews() {
  // Toast messages for success/error feedback
  const showToast = useToast();
  // Reviews on the current page
  const [reviews, setReviews] = useState([]);
  // Total number of brand reviews
  const [total, setTotal] = useState(0);
  // Current page number
  const [page, setPage] = useState(1);
  // Loading state for the table
  const [loading, setLoading] = useState(true);
  // Id of the review being deleted, so only its button is disabled
  const [deletingId, setDeletingId] = useState(null);
  // Number of the newest request; older answers that arrive late are ignored
  const requestId = useRef(0);
  // Page shown right now (a delete finishing later refreshes this, not the old one)
  const pageRef = useRef(page);
  pageRef.current = page;

  // Load one page of brand reviews
  const fetchReviews = useCallback(async (pg) => {
    // This request's number
    const id = ++requestId.current;
    setLoading(true);
    try {
      const data = await adminApi(`/admin/brands/reviews?page=${pg}`);
      // A newer request was sent meanwhile: its answer wins
      if (id !== requestId.current) return;
      // Pages that exist now (at least 1)
      const pages = Math.max(1, data.totalPages || 1);
      // This page no longer exists (its last review was deleted): go back one
      if (pg > pages) {
        // Show the last page and load it now (if the page number already
        // equals it, setPage alone would not reload and the loader would stick)
        setPage(pages);
        return fetchReviews(pages);
      }
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setLoading(false);
    } catch (err) {
      if (id !== requestId.current) return;
      showToast(err.message, "error");
      setLoading(false);
    }
  }, [showToast]);

  // Reload when the page changes
  useEffect(() => {
    fetchReviews(page);
  }, [page, fetchReviews]);

  // Delete one review after confirmation
  const deleteReview = async (review) => {
    // Make sure the admin really means it
    if (!window.confirm(`Delete this ${review.rating}-star review of ${review.brand?.name || "a deleted brand"}?`)) return;
    setDeletingId(review._id);
    try {
      await adminApi(`/admin/brands/reviews/${review._id}`, { method: "DELETE" });
      showToast("Review deleted", "success");
      // Refresh the page shown now (moves back a page if it is now empty)
      fetchReviews(pageRef.current);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-section">
      <p className="admin-gimport-hint" style={{ marginTop: 0 }}>
        Reviews of a brand as a whole. Reviews of single locations are under Reviews.
      </p>

      {loading ? (
        <Loader />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Author</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  {/* Brand name links to its public page */}
                  <td>
                    {r.brand ? (
                      <a href={`/brand/${r.brand.slug}`} target="_blank" rel="noopener noreferrer">{r.brand.name}</a>
                    ) : (
                      "Deleted brand"
                    )}
                  </td>
                  {/* Author name and email (email helps spot spam accounts) */}
                  <td>
                    <div>{r.user?.name || "Deleted user"}</div>
                    {r.user?.email && <div className="admin-gimport-sub">{r.user.email}</div>}
                  </td>
                  <td><StarDisplay rating={r.rating} /></td>
                  {/* Title and the start of the text */}
                  <td className="admin-review-cell">
                    {r.title && r.title !== "Review" && <strong>{r.title}</strong>}
                    <p>{r.comment?.slice(0, 80)}{r.comment?.length > 80 ? "..." : ""}</p>
                  </td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <button
                      className="admin-action-btn admin-delete-btn"
                      title="Delete"
                      aria-label="Delete review"
                      onClick={() => deleteReview(r)}
                      disabled={deletingId === r._id}
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {/* Empty state */}
              {reviews.length === 0 && (
                <tr><td colSpan="6" className="admin-empty">No brand reviews yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} setPage={setPage} total={total} limit={PAGE_SIZE} />
    </div>
  );
}
