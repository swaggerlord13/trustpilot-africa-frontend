import { API_BASE_URL } from "../config.js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../components/Toast.jsx";

export default function ReviewForm({ companyId, companyName, onReviewAdded }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const showToast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // If not logged in, save draft and redirect to register
    if (!token || !user._id) {
      const pendingReview = {
        companyId,
        companyName,
        rating,
        comment: comment.trim(),
        title: title.trim() || "Review",
        returnUrl: window.location.pathname
      };
      localStorage.setItem("pendingReview", JSON.stringify(pendingReview));
      showToast("Create an account to publish your review — we\'ll save your draft!", "info", 5000);
      setTimeout(() => {
        navigate("/register");
      }, 1500);
      return;
    }

    if (!comment.trim()) {
      showToast("Please write a comment", "warning");
      return;
    }

    setSubmitting(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/reviews`,
        {
          companyId,
          rating,
          comment: comment.trim(),
          title: title.trim() || "Review"
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newReview = {
        _id: res.data._id,
        title: res.data.title || title || "Review",
        comment: res.data.comment,
        rating: res.data.rating,
        user: user.name,
        image: user.profileImage || "https://via.placeholder.com/100",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long", 
          day: "numeric",
        }),
        company: companyName,
        companyimage: res.data.company?.logo || res.data.company?.companyImage || "https://via.placeholder.com/150?text=Company+Logo",
        category: "Company",
        createdAt: new Date()
      };

      if (onReviewAdded) {
        onReviewAdded(newReview);
      }

      setComment("");
      setTitle("");
      setRating(5);
      
      showToast("Review submitted successfully!", "success");
    } catch (err) {
      console.error("Error submitting review:", err);
      if (err.response?.status === 401) {
        showToast("Your session has expired. Please log in again.", "warning");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => { navigate("/login"); }, 1500);
      } else {
        showToast(err.response?.data?.error || "Failed to submit review. Please try again.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStarColor = (starRating) => {
    if (starRating <= 2) {
      return "#dc2626";
    } else if (starRating === 3) {
      return "#eab308";
    } else {
      return "#16a34a";
    }
  };

  const renderStars = () => {
    const currentRating = hoveredStar || rating;
    const activeColor = getStarColor(currentRating);
    
    return (
      <div className="flex gap-1 mb-4 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="text-4xl transition-all duration-200 hover:scale-110 transform focus:outline-none"
            style={{
              color: star <= currentRating ? activeColor : "#ccc"
            }}
          >
            \u2605
          </button>
        ))}
        <div className="ml-3 flex flex-col justify-center">
          <span className="text-slate-700 font-semibold text-lg">
            {rating} star{rating !== 1 ? 's' : ''}
          </span>
          <span className="text-sm text-slate-500">
            {rating <= 2 && "Poor"}
            {rating === 3 && "Average"}
            {rating >= 4 && "Excellent"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-brand-50 to-coral-50 p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-brand-700 mb-2">
          <i className="bx bx-edit-alt mr-2"></i>Write a Review for {companyName}
        </h3>
        <p className="text-slate-600">Share your experience to help others!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Selection */}
        <div className="text-center">
          <label className="block text-lg font-semibold text-slate-700 mb-3">
            How would you rate this company?
          </label>
          {renderStars()}
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Review Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Great service and support!"
            maxLength={100}
            className="w-full p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all duration-200 text-slate-800"
          />
        </div>

        {/* Review Comment */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="6"
            placeholder="Tell us about your experience with this company. What did you like or dislike? Would you recommend them to others?"
            className="w-full p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none resize-none transition-all duration-200 text-slate-800"
            required
          />
          <div className="text-right text-sm text-slate-500 mt-1">
            {comment.length}/1000 characters
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className={`px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all duration-200 transform ${
              submitting || !comment.trim()
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 hover:scale-105 shadow-lg"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting Review...
              </span>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </form>

      {/* Encouragement Message */}
      <div className="mt-6 p-4 bg-white/60 rounded-lg border border-brand-100">
        <p className="text-sm text-slate-600 text-center">
          <i className="bx bx-bulb text-brand-500 mr-1"></i>
          <strong>Tip:</strong> Be specific and honest in your review. 
          Mention what you liked, what could be improved, and whether you\'d recommend this company to others.
        </p>
      </div>
    </div>
  );
}
