import api from "../api.js";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "../components/Footer.jsx";
import Loader from "../components/Loader.jsx";
import DashboardOverview from "../components/dashboard/DashboardOverview.jsx";
import DashboardReviews from "../components/dashboard/DashboardReviews.jsx";
import DashboardProfile from "../components/dashboard/DashboardProfile.jsx";
import CompanyLogo from "../components/CompanyLogo";

export default function CompanyDashboard() {
  const { companyId } = useParams();

  // Core state
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Reviews pagination and sort
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);


  // Fetch company info, stats, and reviews
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, reviewsRes] = await Promise.all([
          api.get(`/company-dashboard/${companyId}/stats`),
          api.get(`/company-dashboard/${companyId}/reviews?sort=${reviewSort}&page=${reviewPage}&limit=10`),
        ]);

        setStats(statsRes.data);
        setReviews(reviewsRes.data.reviews);
        // The dashboard route reports the page count as pagination.pages
        setTotalReviewPages(reviewsRes.data.pagination?.pages || 1);

        const companyRes = await api.get(`/companies/by-id/${companyId}`);
        setCompany(companyRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard load error:", err);
        if (err.response?.status === 403) {
          setError("You don't have access to this company's dashboard. You need an approved claim first.");
        } else {
          setError("Failed to load dashboard data.");
        }
        setLoading(false);
      }
    };

    fetchAll();
  }, [companyId, reviewSort, reviewPage]);

  const ratingColor = (rating) => {
    if (rating >= 4) return "text-green-500";
    if (rating >= 3) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader message="Loading Dashboard..." />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-900/50 p-8 max-w-md text-center border border-slate-200 dark:border-slate-600">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="bx bx-lock-alt text-red-500 dark:text-red-400 text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Access Denied</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Link to="/" className="px-5 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold">
                Go Home
              </Link>
              <Link to="/profile" className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-semibold">
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Dashboard Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-900/50 p-6 mb-6 border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <CompanyLogo logo={company?.logo} url={company?.url} name={company?.name} size={64} />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{company?.name}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{company?.category?.name || "General"}</p>
                <Link to={`/company/${company?.slug}`} className="text-brand-500 hover:text-brand-600 text-sm inline-flex items-center mt-1">
                  <i className="bx bx-link-external mr-1"></i> View Public Page
                </Link>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${ratingColor(stats?.avgRating || 0)}`}>
                  {stats?.avgRating || "-"}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {stats?.totalReviews || 0} reviews
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 p-1">
            {[
              { id: "overview", label: "Overview", icon: "bx-bar-chart-alt-2" },
              { id: "reviews", label: "Reviews", icon: "bx-chat" },
              { id: "profile", label: "Edit Profile", icon: "bx-edit" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-sm ${
                  activeTab === tab.id
                    ? "bg-brand-500 text-white shadow-md dark:shadow-slate-900/40"
                    : "text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700"
                }`}
              >
                <i className={`bx ${tab.icon} mr-1`}></i> {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && stats && (
            <DashboardOverview stats={stats} ratingColor={ratingColor} />
          )}

          {activeTab === "reviews" && (
            <DashboardReviews
              companyId={companyId}
              stats={stats}
              reviews={reviews}
              setReviews={setReviews}
              reviewSort={reviewSort}
              setReviewSort={setReviewSort}
              reviewPage={reviewPage}
              setReviewPage={setReviewPage}
              totalReviewPages={totalReviewPages}
            />
          )}

          {activeTab === "profile" && (
            <DashboardProfile
              company={company}
              setCompany={setCompany}
              companyId={companyId}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
