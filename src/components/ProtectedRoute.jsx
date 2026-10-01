import { Navigate, useLocation } from "react-router-dom";
// Login URL that comes back to this page afterwards
import { loginUrl } from "../utils/authRedirect.js";
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
  // The page being opened, to return to after logging in
  const location = useLocation();

  // Not logged in at all: send to login, then back here
  if (!isLoggedIn) {
    return <Navigate to={loginUrl(`${location.pathname}${location.search}${location.hash}`)} replace />;
  }

  // Logged in but not admin, and this page needs admin
  // Silently redirect to homepage. Don't reveal the page exists
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
