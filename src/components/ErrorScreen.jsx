/**
 * Full-page error screen shared by RouteError (inside the router) and
 * ErrorBoundary (outside the router). Uses plain <a> links, not <Link>,
 * so it also works where there is no router.
 */
export default function ErrorScreen({ icon = "bx-error-circle", title, message }) {
  return (
    // Full-height centred panel that works in light and dark mode
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      {/* Narrow column so the text stays readable on wide screens */}
      <div className="text-center max-w-md">
        {/* Icon in a soft circle */}
        <div className="w-16 h-16 mx-auto mb-6 bg-coral-50 rounded-full flex items-center justify-center">
          {/* Boxicons class passed in by the caller */}
          <i className={`bx ${icon} text-3xl text-coral-500`}></i>
        </div>
        {/* Short headline explaining what happened */}
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">{title}</h1>
        {/* One sentence telling the visitor what to do */}
        <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>
        {/* Two actions side by side on desktop, stacked on mobile */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Full reload fetches the newest files from the server */}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold"
          >
            Refresh Page
          </button>
          {/* Plain link: full page load, works with or without a router */}
          <a
            href="/"
            className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors font-semibold"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
