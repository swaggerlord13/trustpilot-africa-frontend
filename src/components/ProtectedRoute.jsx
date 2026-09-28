import { Navigate } from "react-router-dom";

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
  // Silently redirect to homepage — don't reveal the page exists
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
