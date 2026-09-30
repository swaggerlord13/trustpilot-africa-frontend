import { useState, useEffect, useCallback } from "react";
import { adminApi, StarDisplay, formatDate, Pagination, toggleSelect, toggleSelectAll } from "./adminHelpers.jsx";
import { useToast } from "../Toast.jsx";
import Loader from "../Loader.jsx";

export default function AdminReviews() {
  const showToast = useToast();
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async (pg, search) => {
    setLoading(true);
    try {
      const data = await adminApi(`/admin/reviews?page=${pg}&limit=15&search=${encodeURIComponent(search)}`);
      setReviews(data.reviews);
      setReviewsTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(reviewsPage, reviewsSearch);
  }, [reviewsPage]);

  useEffect(() => {
    const t = setTimeout(() => { setReviewsPage(1); fetchReviews(1, reviewsSearch); }, 400);
    return () => clearTimeout(t);
  }, [reviewsSearch]);

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    try {
      await adminApi(`/admin/reviews/${id}`, { method: "DELETE" });
      showToast("Review deleted", "success");
      fetchReviews(reviewsPage, reviewsSearch);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const bulkDeleteReviews = async () => {
    if (selectedReviews.length === 0) return;
    if (!window.confirm(`Delete ${selectedReviews.length} review(s)? This cannot be undone.`)) return;
    try {
      await adminApi("/admin/reviews/bulk", {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedReviews }),
      });
      showToast(`${selectedReviews.length} review(s) deleted`, "success");
      setSelectedReviews([]);
      fetchReviews(reviewsPage, reviewsSearch);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Search reviews by company, user, or content..."
            value={reviewsSearch}
            onChange={(e) => setReviewsSearch(e.target.value)}
          />
        </div>
        {selectedReviews.length > 0 && (
          <button className="admin-bulk-btn admin-bulk-delete" onClick={bulkDeleteReviews}>
            <i className="bx bx-trash"></i> Delete {selectedReviews.length} selected
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={reviews.length > 0 && selectedReviews.length === reviews.length}
                    onChange={() => toggleSelectAll(reviews, selectedReviews, setSelectedReviews)}
                  />
                </th>
                <th>Company</th>
                <th>User</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id} className={selectedReviews.includes(r._id) ? "selected" : ""}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedReviews.includes(r._id)}
                      onChange={() => toggleSelect(selectedReviews, setSelectedReviews, r._id)}
                    />
                  </td>
                  <td>
                    <div className="admin-company-cell">
                      <img
                        src={r.company?.logo || ""}
                        alt=""
                        className="admin-company-logo-sm"
                        onError={(e) => { e.target.src = ""; }}
                      />
                      <span>{r.company?.name || "Deleted"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-user-cell">
                      <img
                        src={r.user?.profileImage || "https://avatar.iran.liara.run/public"}
                        alt=""
                        className="admin-avatar-sm"
                      />
                      <span>{r.user?.name || "Deleted"}</span>
                    </div>
                  </td>
                  <td><StarDisplay rating={r.rating} /></td>
                  <td className="admin-review-cell">
                    <strong>{r.title}</strong>
                    <p>{r.comment?.slice(0, 80)}{r.comment?.length > 80 ? "..." : ""}</p>
                  </td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <button className="admin-action-btn admin-delete-btn" title="Delete" onClick={() => deleteReview(r._id)}>
                      <i className="bx bx-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr><td colSpan="7" className="admin-empty">No reviews found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={reviewsPage} setPage={setReviewsPage} total={reviewsTotal} />
    </div>
  );
}
