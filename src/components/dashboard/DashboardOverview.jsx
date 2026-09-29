export default function DashboardOverview({ stats, ratingColor }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 text-center">
          <div className="text-3xl font-bold text-brand-500">{stats.totalReviews}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total Reviews</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 text-center">
          <div className={`text-3xl font-bold ${ratingColor(stats.avgRating)}`}>{stats.avgRating}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Avg Rating</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 text-center">
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.recentReviewCount}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Last 30 Days</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 text-center">
          <div className="text-3xl font-bold text-coral-500">{stats.replyRate}%</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Reply Rate</div>
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
                <div className="w-16 text-right text-sm text-slate-500 dark:text-slate-400">{count} ({pct}%)</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
