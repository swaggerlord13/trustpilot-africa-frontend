import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast.jsx";
import "../styles/AdminPanel.css";
import { useAuth } from "../components/AuthProvider.jsx";

// ─── Section sub-components ─────────────────────────────
import AdminOverview from "../components/admin/AdminOverview.jsx";
import AdminUsers from "../components/admin/AdminUsers.jsx";
import AdminCompanies from "../components/admin/AdminCompanies.jsx";
import AdminReviews from "../components/admin/AdminReviews.jsx";
import AdminCategories from "../components/admin/AdminCategories.jsx";
import AdminClaims from "../components/admin/AdminClaims.jsx";
import { adminApi } from "../components/admin/adminHelpers.jsx";

// ─── Main Component (shell only) ────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const showToast = useToast();

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Overview stats (fetched here so stat cards can navigate to sections)
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi("/admin/stats");
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "overview") fetchStats();
  }, [activeSection]);

  // ─── Sidebar nav items ─────────────────────────────────
  const navItems = [
    { key: "overview", icon: "bx-grid-alt", label: "Overview" },
    { key: "companies", icon: "bx-buildings", label: "Companies" },
    { key: "reviews", icon: "bx-message-square-detail", label: "Reviews" },
    { key: "users", icon: "bx-group", label: "Users" },
    { key: "categories", icon: "bx-folder", label: "Categories" },
    { key: "claims", icon: "bx-badge-check", label: "Claims" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* ─── Sidebar ───────────────────────────────── */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <img src="/trustpilotafricalogo.png" alt="TrustPilot Africa" className="admin-sidebar-logo" />
          <span className="admin-sidebar-title">Admin</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item ${activeSection === item.key ? "active" : ""}`}
              onClick={() => {
                setActiveSection(item.key);
                setSidebarOpen(false);
              }}
            >
              <i className={`bx ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={() => navigate("/")}>
            <i className="bx bx-arrow-back"></i>
            <span>Back to Site</span>
          </button>
          <button className="admin-nav-item admin-logout-btn" onClick={handleLogout}>
            <i className="bx bx-log-out"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main content ────────────────────────── */}
      <main className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="bx bx-menu"></i>
          </button>
          <h1 className="admin-page-title">
            {navItems.find((n) => n.key === activeSection)?.label || "Admin"}
          </h1>
        </header>

        <div className="admin-content">
          {activeSection === "overview" && (
            <AdminOverview stats={stats} setActiveSection={setActiveSection} />
          )}
          {activeSection === "users" && <AdminUsers />}
          {activeSection === "companies" && <AdminCompanies />}
          {activeSection === "reviews" && <AdminReviews />}
          {activeSection === "categories" && <AdminCategories />}
          {activeSection === "claims" && <AdminClaims />}
        </div>
      </main>
    </div>
  );
}
