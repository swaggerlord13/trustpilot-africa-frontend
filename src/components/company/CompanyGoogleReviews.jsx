import UserAvatar from "../UserAvatar";

export default function CompanyGoogleReviews({ company }) {
  if (!company.googleReviews || company.googleReviews.length === 0) return null;

  return (
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
              <UserAvatar
                src={review.profilePhotoUrl}
                alt={review.authorName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600"
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
  );
}
