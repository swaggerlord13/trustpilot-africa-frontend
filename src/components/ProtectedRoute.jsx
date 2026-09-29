import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";

/**
 * ProtectedRoute: wraps pages that need login (and optionally admin rights).
 *
 * Usage in the router:
 *   <ProtectedRoute><ProfilePage /></ProtectedRoute>         : login required
 *   <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>  : admin required
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, isAdmin } = useAuth();

  // Not logged in at all, send to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin, and this page needs admin
  // Silently redirect to homepage. Don't reveal the page exists
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
