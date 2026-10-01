import api from "../../api.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthProvider.jsx";
import { useToast } from "../Toast.jsx";
import UserAvatar from "../UserAvatar.jsx";
import ButtonSpinner from "../ButtonSpinner.jsx";
import ReviewSortBar from "../ReviewSortBar.jsx";
// Shared star display and colour scale, same as company pages
import StarRating from "../StarRatings.jsx";
import { starColor } from "../../utils/starColor.js";
import "../../styles/ReviewSortBar.css";

// Reviews loaded per page / "Load more" click
const PAGE_SIZE = 10;
// Same limits as the server
const MIN_COMMENT = 10;
const MAX_COMMENT = 1000;
const MAX_TITLE = 100;

// "12 March 2026" style date
function formatDate(value) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Form to write or edit a review of the brand.
 * `initial` is the existing review when editing, or null for a new one.
 */
function BrandReviewForm({ brand, initial, onSaved, onCancel }) {
  const showToast = useToast();
  // Chosen stars (0 = none yet)
  const [rating, setRating] = useState(initial?.rating || 0);
  // Star under the mouse, for the hover preview
  const [hovered, setHovered] = useState(0);
  // Optional headline ("Review" is the server default, so show it as empty)
  const [title, setTitle] = useState(initial?.title && initial.title !== "Review" ? initial.title : "");
  // Review text
  const [comment, setComment] = useState(initial?.comment || "");
  // True while saving
  const [saving, setSaving] = useState(false);
  // Problem to show under the form
  const [error, setError] = useState("");

  // Stars shown: hover preview, else the chosen rating
  const shown = hovered || rating;
  // Comment length after trimming, as the server counts it
  const commentLength = comment.trim().length;
  // Everything needed before the button turns on
  const canSave = rating > 0 && commentLength >= MIN_COMMENT && commentLength <= MAX_COMMENT && !saving;

  // Send the review: POST for new, PUT for an edit
  const submit = async (e) => {
    // Keep the browser from reloading the page
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      // Fields the server accepts
      const body = { rating, title: title.trim(), comment: comment.trim() };
      // New review, or edit of the user's existing one
      const res = initial
        ? await api.put(`/brands/${encodeURIComponent(brand.slug)}/reviews/${initial._id}`, body)
        : await api.post(`/brands/${encodeURIComponent(brand.slug)}/reviews`, body);
      showToast(initial ? "Your review was updated" : "Thanks! Your review is live", "success");
      // Hand the saved review back to the section
      onSaved(res.data.review);
    } catch (err) {
      // Server message, e.g. "You have already reviewed this brand"
      setError(err.response?.data?.error || "Could not save your review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-gradient-to-br from-brand-50 to-coral-50 dark:from-slate-800 dark:to-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-600 mb-6 space-y-5">
      <h3 className="text-xl font-bold text-brand-700 dark:text-brand-300">
        <i className="bx bx-edit-alt mr-2"></i>
        {initial ? "Edit your review" : `Review ${brand.name} as a whole`}
      </h3>

      {/* Star picker: radio-like buttons so keyboard users can choose too */}
      <fieldset>
        <legend className="block font-semibold text-slate-700 dark:text-slate-200 mb-2">Your rating</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
              aria-pressed={rating === star}
              className="text-4xl leading-none transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              style={{ color: star <= shown ? starColor(shown) : "#ccc" }}
            >
              ★
            </button>
          ))}
          {/* Chosen value in words */}
          {rating > 0 && (
            <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">
              {rating} star{rating !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </fieldset>

      {/* Optional headline */}
      <div>
        <label htmlFor="brand-review-title" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Title (optional)
        </label>
        <input
          id="brand-review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE}
          placeholder="e.g. Reliable network across the country"
          className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-brand-500 outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700"
        />
      </div>

      {/* Review text with a live character count */}
      <div>
        <label htmlFor="brand-review-comment" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Your review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="brand-review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="5"
          maxLength={MAX_COMMENT}
          placeholder={`What is ${brand.name} like overall, across its locations?`}
          className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-brand-500 outline-none resize-y text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700"
          required
        />
        <div className={`text-right text-sm mt-1 ${commentLength > 0 && commentLength < MIN_COMMENT ? "text-red-500" : "text-slate-500 dark:text-slate-400"}`}>
          {commentLength < MIN_COMMENT ? `At least ${MIN_COMMENT} characters` : `${commentLength}/${MAX_COMMENT}`}
        </div>
      </div>

      {/* Server problem, if any */}
      {error && <p className="text-red-600 dark:text-red-400 text-sm" role="alert">{error}</p>}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="px-5 py-2.5 rounded-lg font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {saving && <ButtonSpinner color="border-white" />}
          {saving ? "Saving..." : initial ? "Save changes" : "Post review"}
        </button>
      </div>
    </form>
  );
}

// One review card
function ReviewCard({ review, isMine, onEdit, onDelete, deleting }) {
  return (
    <li className="py-5 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <div className="flex items-start gap-3">
        <UserAvatar src={review.user?.profileImage} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-100">{review.user?.name || "Anonymous"}</span>
            {isMine && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">Your review</span>
            )}
            <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(review.createdAt)}</span>
          </div>
          <div className="mt-1" aria-label={`${review.rating} out of 5 stars`}><StarRating rating={review.rating} /></div>
          {review.title && review.title !== "Review" && (
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mt-1">{review.title}</h4>
          )}
          {/* whitespace-pre-line keeps the reviewer's line breaks */}
          <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-line break-words">{review.comment}</p>
          {/* Edit / delete for the author */}
          {isMine && (
            <div className="flex gap-4 mt-2">
              <button type="button" onClick={onEdit} className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 inline-flex items-center gap-1">
                <i className="bx bx-edit"></i> Edit
              </button>
              <button type="button" onClick={onDelete} disabled={deleting} className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 inline-flex items-center gap-1 disabled:opacity-60">
                <i className="bx bx-trash"></i> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Reviews of the brand as a whole (not of one location), with a form to
 * write, edit or delete your own. `onChanged` lets the page refresh the
 * overall rating after a review is added, edited or removed.
 */
export default function BrandReviews({ brand, onChanged }) {
  const { isLoggedIn } = useAuth();
  const showToast = useToast();
  // Reviews shown in the list
  const [reviews, setReviews] = useState([]);
  // Paging info from the server
  const [pagination, setPagination] = useState(null);
  // Current sort
  const [sort, setSort] = useState("newest");
  // True while the first page loads
  const [loading, setLoading] = useState(true);
  // True while "Load more" runs
  const [loadingMore, setLoadingMore] = useState(false);
  // Problem loading the list
  const [error, setError] = useState("");
  // The logged-in user's own review (null = none yet)
  const [mine, setMine] = useState(null);
  // null = form closed, "new" = writing, "edit" = editing own review
  const [formMode, setFormMode] = useState(null);
  // True while deleting own review
  const [deleting, setDeleting] = useState(false);
  // Bumped on every fresh load of page 1; an answer from an older load
  // (including a "Load more" started before it) is dropped
  const listGen = useRef(0);

  // Base URL of this brand's reviews
  const base = `/brands/${encodeURIComponent(brand.slug)}/reviews`;

  // Load page 1 for the current sort (replaces the list)
  const loadFirstPage = useCallback(async () => {
    // This load's number
    const gen = ++listGen.current;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`${base}?sort=${sort}&page=1&limit=${PAGE_SIZE}`);
      // A newer load started meanwhile: it owns the list
      if (gen !== listGen.current) return;
      setReviews(res.data.reviews || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      if (gen !== listGen.current) return;
      setError(err.response?.data?.error || "Could not load reviews");
    } finally {
      if (gen === listGen.current) setLoading(false);
    }
  }, [base, sort]);

  // Load when the brand or sort changes
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // Load the user's own review when logged in (so we offer "Edit" not "Write")
  useEffect(() => {
    // Logged out: no review of their own
    if (!isLoggedIn) {
      setMine(null);
      return;
    }
    // Ignore a late answer after logout or a brand change
    let ignore = false;
    api
      // Background check: an expired login must not redirect from this public page
      .get(`${base}/mine`, { skipAuthRedirect: true })
      .then((res) => {
        if (!ignore) setMine(res.data.review || null);
      })
      .catch(() => {
        // Not critical: the server still blocks a second review with a clear message
      });
    return () => {
      ignore = true;
    };
  }, [base, isLoggedIn]);

  // Next page appended to the list
  const loadMore = async () => {
    if (!pagination?.hasNextPage) return;
    // Which load of the list this page belongs to
    const gen = listGen.current;
    setLoadingMore(true);
    try {
      const res = await api.get(`${base}?sort=${sort}&page=${pagination.page + 1}&limit=${PAGE_SIZE}`);
      // List was reloaded meanwhile (sort change, save, delete): drop it
      if (gen !== listGen.current) return;
      setReviews((prev) => [...prev, ...(res.data.reviews || [])]);
      setPagination(res.data.pagination || null);
    } catch (err) {
      // Failure for a list no longer shown: nothing to say
      if (gen !== listGen.current) return;
      // Keep what is shown; just say it failed
      showToast(err.response?.data?.error || "Could not load more reviews", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  // After posting or editing: store it, close the form, refresh list and rating
  const handleSaved = (review) => {
    setMine(review);
    setFormMode(null);
    loadFirstPage();
    onChanged?.();
  };

  // Delete the user's own review after confirming
  const deleteMine = async () => {
    if (!mine || !window.confirm("Delete your review of this brand?")) return;
    setDeleting(true);
    try {
      await api.delete(`${base}/${mine._id}`);
      showToast("Your review was deleted", "success");
      setMine(null);
      // Close an open edit form, so it can't re-post the deleted text
      setFormMode(null);
      loadFirstPage();
      onChanged?.();
    } catch (err) {
      showToast(err.response?.data?.error || "Could not delete your review", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Id of the user's own review, to mark it in the list
  const mineId = mine?._id;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100 dark:border-slate-700 mt-8" aria-labelledby="brand-reviews-title">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h2 id="brand-reviews-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">
            <i className="bx bx-message-square-detail text-brand-500 mr-2"></i>
            Reviews of {brand.name} as a whole
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            About the brand in general. For one branch, open it from the list above.
          </p>
        </div>

        {/* Write / edit / log in, depending on who is looking */}
        {formMode === null && (
          !isLoggedIn ? (
            <Link to="/login" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-brand-500 hover:bg-brand-600 text-center">
              Log in to write a review
            </Link>
          ) : mine ? (
            <button type="button" onClick={() => setFormMode("edit")} className="px-5 py-2.5 rounded-lg font-semibold bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/30">
              <i className="bx bx-edit mr-1"></i> Edit your review
            </button>
          ) : (
            <button type="button" onClick={() => setFormMode("new")} className="px-5 py-2.5 rounded-lg font-semibold text-white bg-brand-500 hover:bg-brand-600">
              <i className="bx bx-edit-alt mr-1"></i> Write a review
            </button>
          )
        )}
      </div>

      {/* Write / edit form */}
      {formMode && (
        <div className="mt-4">
          <BrandReviewForm
            brand={brand}
            initial={formMode === "edit" ? mine : null}
            onSaved={handleSaved}
            onCancel={() => setFormMode(null)}
          />
        </div>
      )}

      {/* Sort and count */}
      {pagination?.total > 0 && (
        <ReviewSortBar currentSort={sort} onSortChange={setSort} totalReviews={pagination.total} />
      )}

      {/* Loading, error, empty or the list */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-400">
          <ButtonSpinner /> Loading reviews...
        </div>
      ) : error ? (
        <p className="text-red-500 py-6 text-center" role="alert">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 py-6 text-center">
          No reviews of {brand.name} as a whole yet. Be the first!
        </p>
      ) : (
        <ul>
          {reviews.map((r) => (
            <ReviewCard
              key={r._id}
              review={r}
              isMine={r._id === mineId}
              onEdit={() => {
                setFormMode("edit");
                // Bring the form into view
                document.getElementById("brand-reviews-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              onDelete={deleteMine}
              deleting={deleting}
            />
          ))}
        </ul>
      )}

      {/* More pages */}
      {!loading && pagination?.hasNextPage && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 rounded-lg font-semibold bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/30 disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load more reviews"}
          </button>
        </div>
      )}
    </section>
  );
}
