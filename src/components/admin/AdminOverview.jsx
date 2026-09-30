import Loader from "../Loader.jsx";

export default function AdminOverview({ stats, setActiveSection }) {
  if (!stats) {
    return (
      <Loader />
    );
  }

  return (
    <div className="admin-overview">
      <div className="admin-stat-grid">
        <div className="admin-stat-card" onClick={() => setActiveSection("users")}>
          <div className="admin-stat-icon" style={{ background: "#EEF2FF" }}>
            <i className="bx bx-group" style={{ color: "#6366F1" }}></i>
          </div>
          <div>
            <p className="admin-stat-number">{stats.totalUsers}</p>
            <p className="admin-stat-label">Total Users</p>
          </div>
          <span className="admin-stat-badge">+{stats.newUsers} this week</span>
        </div>

        <div className="admin-stat-card" onClick={() => setActiveSection("companies")}>
          <div className="admin-stat-icon" style={{ background: "#FEF3C7" }}>
            <i className="bx bx-buildings" style={{ color: "#D97706" }}></i>
          </div>
          <div>
            <p className="admin-stat-number">{stats.totalCompanies}</p>
            <p className="admin-stat-label">Companies</p>
          </div>
          <span className="admin-stat-badge">+{stats.newCompanies} this week</span>
        </div>

        <div className="admin-stat-card" onClick={() => setActiveSection("reviews")}>
          <div className="admin-stat-icon" style={{ background: "#ECFDF5" }}>
            <i className="bx bx-message-square-detail" style={{ color: "#059669" }}></i>
          </div>
          <div>
            <p className="admin-stat-number">{stats.totalReviews}</p>
            <p className="admin-stat-label">Reviews</p>
          </div>
          <span className="admin-stat-badge">+{stats.newReviews} this week</span>
        </div>

        <div className="admin-stat-card" onClick={() => setActiveSection("categories")}>
          <div className="admin-stat-icon" style={{ background: "#FDF2F8" }}>
            <i className="bx bx-folder" style={{ color: "#DB2777" }}></i>
          </div>
          <div>
            <p className="admin-stat-number">{stats.totalCategories}</p>
            <p className="admin-stat-label">Categories</p>
          </div>
        </div>
      </div>
    </div>
  );
}
