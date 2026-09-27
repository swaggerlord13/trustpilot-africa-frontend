import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { ToastProvider } from "../components/Toast.jsx";
import ThemeProvider from "../components/ThemeProvider.jsx";

import App from "../pages/App.jsx";
import About from "../pages/About.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import RegisterBusiness from "../pages/RegisterBusiness.jsx";
import Categories from "../pages/categories.jsx";
import CategoryCompanies from "./CategoryCompanies.jsx";
import Subcategory from "../pages/Subcategory.jsx";
import ProfilePage from "../pages/Profile.jsx";
import AdminDashboard from "../pages/Add.jsx";
import CompanyPage from "./companyPage.jsx";
import CompanyDashboard from "./CompanyDashboard.jsx";
import BrowseReviews from "../pages/BrowseReviews.jsx";
import FullReviewPage from "../pages/FullReviewPage.jsx";
import NotFound from "../pages/NotFound.jsx";
import Terms from "../pages/Terms.jsx";
import Privacy from "../pages/Privacy.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import RootLayout from "../components/RootLayout.jsx";

import "../styles/index.css";

const router = createBrowserRouter([
  { element: <RootLayout />, children: [
  { path: "/", element: <App /> },
  { path: "/about", element: <About /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/register-business", element: <RegisterBusiness /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password/:token", element: <ResetPassword /> },
  { path: "/terms", element: <Terms /> },
  { path: "/privacy", element: <Privacy /> },

  // Categories
  { path: "/categories", element: <Categories /> },
  { path: "/categories/:slug", element: <CategoryCompanies /> },
  { path: "/categories/:slug/:subSlug", element: <Subcategory /> },
  { path: "/company/:slug", element: <CompanyPage /> },

  // User
  { path: "/profile", element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
  { path: "/add", element: <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute> },
  { path: "/browse-reviews", element: <BrowseReviews /> },
  { path: "/review/:reviewId", element: <FullReviewPage /> },

  // Company Dashboard (requires login - access checked by backend)
  { path: "/company-dashboard/:companyId", element: <ProtectedRoute><CompanyDashboard /></ProtectedRoute> },

  // Catch-all 404
  { path: "*", element: <NotFound /> },
  ]},
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
