import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { ToastProvider } from "../components/Toast.jsx";
import ThemeProvider from "../components/ThemeProvider.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "../components/AuthProvider.jsx";
// Friendly page for crashes and failed page loads (replaces React Router's default)
import RouteError from "../components/RouteError.jsx";
// Lets RouteError auto-reload again once the app has been running normally
import { markAppStableLater } from "../utils/chunkReload.js";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

import { lazy, Suspense } from "react";
import Loader from "../components/Loader.jsx";

// Eagerly loaded — needed on first paint
import App from "../pages/App.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import RootLayout from "../components/RootLayout.jsx";

// Lazy loaded — not needed until the user navigates there
const About = lazy(() => import("../pages/About.jsx"));
const RegisterBusiness = lazy(() => import("../pages/RegisterBusiness.jsx"));
const Categories = lazy(() => import("../pages/categories.jsx"));
const CategoryCompanies = lazy(() => import("./CategoryCompanies.jsx"));
const Subcategory = lazy(() => import("../pages/Subcategory.jsx"));
const ProfilePage = lazy(() => import("../pages/Profile.jsx"));
const AdminPanel = lazy(() => import("../pages/AdminPanel.jsx"));
const CompanyPage = lazy(() => import("./companyPage.jsx"));
// Brand page: all locations of one business, e.g. /brand/mtn
const BrandPage = lazy(() => import("./BrandPage.jsx"));
const CompanyDashboard = lazy(() => import("./CompanyDashboard.jsx"));
const BrowseReviews = lazy(() => import("../pages/BrowseReviews.jsx"));
const BrowseCompanies = lazy(() => import("../pages/BrowseCompanies.jsx"));
const FullReviewPage = lazy(() => import("../pages/FullReviewPage.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));
const Terms = lazy(() => import("../pages/Terms.jsx"));
const Privacy = lazy(() => import("../pages/Privacy.jsx"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("../pages/ResetPassword.jsx"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail.jsx"));

import "../styles/index.css";

const router = createBrowserRouter([
  // Admin panel: separate full-page layout (no site header/footer)
  {
    path: "/admin",
    element: (
      <ProtectedRoute adminOnly>
        <AdminPanel />
      </ProtectedRoute>
    ),
    // Show our friendly error page if the admin panel fails to load or crashes
    errorElement: <RouteError />,
  },

  // Regular site pages: wrapped in RootLayout (header + footer)
  // errorElement: friendly error page for any site page that fails to load or crashes
  { element: <RootLayout />, errorElement: <RouteError />, children: [
  { path: "/", element: <App /> },
  { path: "/about", element: <About /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/register-business", element: <RegisterBusiness /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password/:token", element: <ResetPassword /> },
  { path: "/verify-email/:token", element: <VerifyEmail /> },
  { path: "/terms", element: <Terms /> },
  { path: "/privacy", element: <Privacy /> },

  // Categories
  { path: "/categories", element: <Categories /> },
  { path: "/categories/:slug", element: <CategoryCompanies /> },
  { path: "/categories/:slug/:subSlug", element: <Subcategory /> },
  { path: "/company/:slug", element: <CompanyPage /> },
  { path: "/brand/:slug", element: <BrandPage /> },

  // User
  { path: "/profile", element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
  // Old /add route removed. Admin panel is now at /admin (outside RootLayout)
  { path: "/browse-reviews", element: <BrowseReviews /> },
  { path: "/companies", element: <BrowseCompanies /> },
  { path: "/review/:reviewId", element: <FullReviewPage /> },

  // Company Dashboard (requires login - access checked by backend)
  { path: "/company-dashboard/:companyId", element: <ProtectedRoute><CompanyDashboard /></ProtectedRoute> },

  // Catch-all 404
  { path: "*", element: <NotFound /> },
  ]},
]);

// After the app runs normally for a while, allow a future one-time auto-reload
markAppStableLater();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <ToastProvider>
              <Suspense fallback={<Loader message="Loading..." />}>
                <RouterProvider router={router} />
              </Suspense>
            </ToastProvider>
          </GoogleOAuthProvider>
        ) : (
          <ToastProvider>
            <Suspense fallback={<Loader message="Loading..." />}>
              <RouterProvider router={router} />
            </Suspense>
          </ToastProvider>
        )}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
