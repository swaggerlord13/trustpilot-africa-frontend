import { useEffect, useState } from "react";
import api from "../../api.js";
import UserAvatar from "../UserAvatar";

const Stars = ({ rating, className = "text-sm" }) => (
  <div className="flex" aria-label={`${rating} out of 5 stars`}>
    {[...Array(5)].map((_, i) => (
      <span
        key={i}
        aria-hidden="true"
        className={`${className} ${i < Math.round(rating) ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}
      >
        {"★"}
      </span>
    ))}
  </div>
);

/**
 * Google rating + up to 5 reviews, loaded live from our API (which asks
 * Google). Google's terms require these to be fetched rather than stored,
 * and require each review to credit its author and link back to Google Maps.
 */
export default function CompanyGoogleReviews({ company }) {
  const companyId = company?._id;
  const hasGoogleLink = Boolean(companyId && company?.googlePlaceId);

  // { companyId, data } or { companyId, failed: true }. Keyed by company so
  // the previous company's reviews never show while the next ones load.
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!hasGoogleLink) return;
    let ignore = false; // set when the user moves to another company first
    api
      .get(`/google/reviews/${companyId}`)
      .then((res) => {
        if (!ignore) setState({ companyId, data: res.data });
      })
      .catch(() => {
        if (!ignore) setState({ companyId, failed: true });
      });
    return () => {
      ignore = true;
    };
  }, [companyId, hasGoogleLink]);

  if (!hasGoogleLink) return null;

  const current = state?.companyId === companyId ? state : null;
  if (current?.failed) return null;

  if (!current) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8 mt-8 border border-slate-100 dark:border-slate-700 animate-pulse">
        <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-2/3 mb-3"></div>
        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  const { data } = current;
  if (!data.rating && !data.reviews?.length) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8 mt-8 border border-slate-100 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <img src="https://www.google.com/favicon.ico" alt="" className="w-6 h-6" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reviews from Google</h2>
        {data.rating && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-2xl font-bold text-amber-500">{data.rating}</span>
            <Stars rating={data.rating} className="text-lg" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({data.userRatingCount?.toLocaleString() || 0} reviews on Google)
            </span>
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-4 py-2 mb-6 text-sm text-amber-800 dark:text-amber-300">
        These reviews are sourced from Google and may not reflect the views of Trustpilotafrica users.
      </div>

      <div className="space-y-6">
        {(data.reviews || []).map((review) => (
          <div
            key={`${review.authorUri || review.authorName}-${review.publishTime}`}
            className="border-b border-slate-100 dark:border-slate-700 pb-6 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-4">
              <UserAvatar
                src={review.authorPhotoUri}
                alt={review.authorName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  {review.authorUri ? (
                    <a
                      href={review.authorUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-800 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-300 truncate"
                    >
                      {review.authorName}
                    </a>
                  ) : (
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{review.authorName}</h4>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {review.relativePublishTimeDescription}
                  </span>
                </div>
                {review.rating && (
                  <div className="mb-2">
                    <Stars rating={review.rating} />
                  </div>
                )}
                {review.text && (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">
                    {review.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm">
        <span className="text-slate-500 dark:text-slate-400">Source: Google Maps</span>
        {data.googleMapsUri && (
          <a
            href={data.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-brand-600 dark:text-brand-300 hover:underline"
          >
            See all reviews on Google Maps
            <i className="bx bx-link-external"></i>
          </a>
        )}
      </div>
    </div>
  );
}
