import { Navigate, Link } from "react-router-dom";

/**
 * ProtectedRoute — wraps pages that need login (and optionally admin rights).
 *
 * Usage in the router:
 *   <ProtectedRoute><ProfilePage /></ProtectedRoute>         — login required
 *   <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>  — admin required
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Not logged in at all — send to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin, and this page needs admin
  if (adminOnly && !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-coral-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bx bxs-lock-alt text-3xl text-coral-500"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            You need administrator privileges to access this page. If you believe this is an error, please contact the site owner.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-6 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              Go Home
            </Link>
            <Link
              to="/profile"
              className="px-6 py-2.5 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              My Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
