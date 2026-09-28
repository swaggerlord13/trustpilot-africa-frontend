import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config.js";
import { useToast } from "../components/Toast.jsx";
import "../styles/AdminPanel.css";

// ─── Helpers ──────────────────────────────────────────────
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: getAuthHeaders(),
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function StarDisplay({ rating }) {
  return (
    <span className="admin-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <i key={s} className={`bx ${s <= rating ? "bxs-star" : "bx-star"}`}></i>
      ))}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Main Component ──────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Overview
  const [stats, setStats] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Companies
  const [companies, setCompanies] = useState([]);
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [allCategories, setAllCategories] = useState([]);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [selectedReviews, setSelectedReviews] = useState([]);

  // Categories
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryParent, setNewSubcategoryParent] = useState("");

  // Loading
  const [loading, setLoading] = useState(false);

  // ─── Data Fetchers ──────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const data = await api("/admin/stats");
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchUsers = useCallback(async (pg, search) => {
    setLoading(true);
    try {
      const data = await api(`/admin/users?page=${pg}&limit=15&search=${encodeURIComponent(search)}`);
      setUsers(data.users);
      setUsersTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompanies = useCallback(async (pg, search) => {
    setLoading(true);
    try {
      const data = await api(`/admin/companies?page=${pg}&limit=15&search=${encodeURIComponent(search)}`);
      setCompanies(data.companies);
      setCompaniesTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviews = useCallback(async (pg, search) => {
    setLoading(true);
    try {
      const data = await api(`/admin/reviews?page=${pg}&limit=15&search=${encodeURIComponent(search)}`);
      setReviews(data.reviews);
      setReviewsTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/admin/categories");
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllCategories = useCallback(async () => {
    try {
      const data = await api("/admin/categories");
      setAllCategories(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // ─── Section switcher loads data ───────────────────────
  useEffect(() => {
    if (activeSection === "overview") fetchStats();
    if (activeSection === "users") { fetchUsers(usersPage, usersSearch); }
    if (activeSection === "companies") { fetchCompanies(companiesPage, companiesSearch); fetchAllCategories(); }
    if (activeSection === "reviews") { fetchReviews(reviewsPage, reviewsSearch); }
    if (activeSection === "categories") fetchCategories();
  }, [activeSection]);

  // Refetch on page/search change
  useEffect(() => { if (activeSection === "users") fetchUsers(usersPage, usersSearch); }, [usersPage]);
  useEffect(() => { if (activeSection === "companies") fetchCompanies(companiesPage, companiesSearch); }, [companiesPage]);
  useEffect(() => { if (activeSection === "reviews") fetchReviews(reviewsPage, reviewsSearch); }, [reviewsPage]);

  // Search with debounce effect
  useEffect(() => {
    if (activeSection !== "users") return;
    const t = setTimeout(() => { setUsersPage(1); fetchUsers(1, usersSearch); }, 400);
    return () => clearTimeout(t);
  }, [usersSearch]);

  useEffect(() => {
    if (activeSection !== "companies") return;
    const t = setTimeout(() => { setCompaniesPage(1); fetchCompanies(1, companiesSearch); }, 400);
    return () => clearTimeout(t);
  }, [companiesSearch]);

  useEffect(() => {
    if (activeSection !== "reviews") return;
    const t = setTimeout(() => { setReviewsPage(1); fetchReviews(1, reviewsSearch); }, 400);
    return () => clearTimeout(t);
  }, [reviewsSearch]);

  // ─── Actions ────────────────────────────────────────────

  // Users
  const toggleAdmin = async (userId) => {
    try {
      await api(`/admin/users/${userId}/toggle-admin`, { method: "PUT" });
      showToast("Admin status updated", "success");
      fetchUsers(usersPage, usersSearch);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const bulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`Delete ${selectedUsers.length} user(s) and all their reviews? This cannot be undone.`)) return;
    try {
      await api("/admin/users/bulk", {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedUsers }),
      });
      showToast(`${selectedUsers.length} user(s) deleted`, "success");
      setSelectedUsers([]);
      fetchUsers(usersPage, usersSearch);
      fetchStats();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Companies
  const startEditCompany = (company) => {
    setEditingCompany(company._id);
    setEditForm({
      name: company.name || "",
      url: company.url || "",
      description: company.description || "",
      city: company.city || "",
      country: company.country || "",
      category: company.category?._id || "",
      subcategory: company.subcategory?._id || "",
    });
  };

  const saveCompany = async () => {
    try {
      await api(`/admin/companies/${editingCompany}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      showToast("Company updated", "success");
      setEditingCompany(null);
      fetchCompanies(companiesPage, companiesSearch);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const bulkDeleteCompanies = async () => {
    if (selectedCompanies.length === 0) return;
    if (!window.confirm(`Delete ${selectedCompanies.length} company(ies) and all their reviews? This cannot be undone.`)) return;
    try {
      await api("/admin/companies/bulk", {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedCompanies }),
      });
      showToast(`${selectedCompanies.length} company(ies) deleted`, "success");
      setSelectedCompanies([]);
      fetchCompanies(companiesPage, companiesSearch);
      fetchStats();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Reviews
  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    try {
      await api(`/admin/reviews/${id}`, { method: "DELETE" });
      showToast("Review deleted", "success");
      fetchReviews(reviewsPage, reviewsSearch);
      fetchStats();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const bulkDeleteReviews = async () => {
    if (selectedReviews.length === 0) return;
    if (!window.confirm(`Delete ${selectedReviews.length} review(s)? This cannot be undone.`)) return;
    try {
      await api("/admin/reviews/bulk", {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedReviews }),
      });
      showToast(`${selectedReviews.length} review(s) deleted`, "success");
      setSelectedReviews([]);
      fetchReviews(reviewsPage, reviewsSearch);
      fetchStats();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Categories
  const saveCategory = async (id) => {
    try {
      await api(`/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editCategoryName }),
      });
      showToast("Category renamed", "success");
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const saveSubcategory = async (id) => {
    try {
      await api(`/admin/subcategories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editSubcategoryName }),
      });
      showToast("Subcategory renamed", "success");
      setEditingSubcategory(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      showToast("Category added", "success");
      setNewCategoryName("");
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const addSubcategory = async () => {
    if (!newSubcategoryName.trim() || !newSubcategoryParent) return;
    try {
      await fetch(`${API_BASE_URL}/subcategories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newSubcategoryName.trim(), categoryId: newSubcategoryParent }),
      });
      showToast("Subcategory added", "success");
      setNewSubcategoryName("");
      setNewSubcategoryParent("");
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category, all its subcategories, and all companies under them?")) return;
    try {
      await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      showToast("Category deleted", "success");
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteSubcategory = async (id) => {
    if (!window.confirm("Delete this subcategory and all companies in it?")) return;
    try {
      await fetch(`${API_BASE_URL}/subcategories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      showToast("Subcategory deleted", "success");
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ─── Selection helpers ──────────────────────────────────
  const toggleSelect = (list, setList, id) => {
    setList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (items, selected, setSelected) => {
    if (selected.length === items.length) {
      setSelected([]);
    } else {
      setSelected(items.map((i) => i._id));
    }
  };

  // ─── Pagination helper ─────────────────────────────────
  function Pagination({ page, setPage, total, limit = 15 }) {
    const pages = Math.ceil(total / limit);
    if (pages <= 1) return null;
    return (
      <div className="admin-pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <i className="bx bx-chevron-left"></i> Prev
        </button>
        <span>
          Page {page} of {pages} ({total} total)
        </span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
          Next <i className="bx bx-chevron-right"></i>
        </button>
      </div>
    );
  }

  // ─── Sidebar nav items ─────────────────────────────────
  const navItems = [
    { key: "overview", icon: "bx-grid-alt", label: "Overview" },
    { key: "companies", icon: "bx-buildings", label: "Companies" },
    { key: "reviews", icon: "bx-message-square-detail", label: "Reviews" },
    { key: "users", icon: "bx-group", label: "Users" },
    { key: "categories", icon: "bx-folder", label: "Categories" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-change"));
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
          {/* ── OVERVIEW ────────────────────────── */}
          {activeSection === "overview" && (
            <div className="admin-overview">
              {stats ? (
                <>
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
                </>
              ) : (
                <div className="admin-loading">
                  <div className="admin-spinner"></div>
                </div>
              )}
            </div>
          )}

          {/* ── USERS ───────────────────────────── */}
          {activeSection === "users" && (
            <div className="admin-section">
              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <i className="bx bx-search"></i>
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                  />
                </div>
                {selectedUsers.length > 0 && (
                  <button className="admin-bulk-btn admin-bulk-delete" onClick={bulkDeleteUsers}>
                    <i className="bx bx-trash"></i> Delete {selectedUsers.length} selected
                  </button>
                )}
              </div>

              {loading ? (
                <div className="admin-loading"><div className="admin-spinner"></div></div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={users.length > 0 && selectedUsers.length === users.length}
                            onChange={() => toggleSelectAll(users, selectedUsers, setSelectedUsers)}
                          />
                        </th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Provider</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} className={selectedUsers.includes(u._id) ? "selected" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(u._id)}
                              onChange={() => toggleSelect(selectedUsers, setSelectedUsers, u._id)}
                            />
                          </td>
                          <td>
                            <div className="admin-user-cell">
                              <img
                                src={u.profileImage || "https://avatar.iran.liara.run/public"}
                                alt=""
                                className="admin-avatar"
                              />
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td className="admin-email-cell">{u.email}</td>
                          <td>
                            <span className={`admin-badge ${u.isAdmin ? "admin-badge-admin" : "admin-badge-user"}`}>
                              {u.isAdmin ? "Admin" : "User"}
                            </span>
                          </td>
                          <td>{u.authProvider || "email"}</td>
                          <td>{formatDate(u.createdAt)}</td>
                          <td>
                            <button
                              className="admin-action-btn"
                              title={u.isAdmin ? "Remove admin" : "Make admin"}
                              onClick={() => toggleAdmin(u._id)}
                            >
                              <i className={`bx ${u.isAdmin ? "bx-shield-minus" : "bx-shield-plus"}`}></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan="7" className="admin-empty">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={usersPage} setPage={setUsersPage} total={usersTotal} />
            </div>
          )}

          {/* ── COMPANIES ───────────────────────── */}
          {activeSection === "companies" && (
            <div className="admin-section">
              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <i className="bx bx-search"></i>
                  <input
                    type="text"
                    placeholder="Search companies by name, URL, city, country..."
                    value={companiesSearch}
                    onChange={(e) => setCompaniesSearch(e.target.value)}
                  />
                </div>
                {selectedCompanies.length > 0 && (
                  <button className="admin-bulk-btn admin-bulk-delete" onClick={bulkDeleteCompanies}>
                    <i className="bx bx-trash"></i> Delete {selectedCompanies.length} selected
                  </button>
                )}
              </div>

              {loading ? (
                <div className="admin-loading"><div className="admin-spinner"></div></div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={companies.length > 0 && selectedCompanies.length === companies.length}
                            onChange={() => toggleSelectAll(companies, selectedCompanies, setSelectedCompanies)}
                          />
                        </th>
                        <th>Company</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Website</th>
                        <th>Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c) => (
                        <tr key={c._id} className={selectedCompanies.includes(c._id) ? "selected" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedCompanies.includes(c._id)}
                              onChange={() => toggleSelect(selectedCompanies, setSelectedCompanies, c._id)}
                            />
                          </td>
                          <td>
                            <div className="admin-company-cell">
                              <img
                                src={c.logo || "https://via.placeholder.com/32?text=Co"}
                                alt=""
                                className="admin-company-logo"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/32?text=Co"; }}
                              />
                              <span>{c.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="admin-badge admin-badge-cat">
                              {c.category?.name || "-"}
                            </span>
                          </td>
                          <td>{c.city && c.country ? `${c.city}, ${c.country}` : c.country || "-"}</td>
                          <td className="admin-url-cell">
                            {c.url ? (
                              <a href={c.url} target="_blank" rel="noreferrer">{c.url.replace(/^https?:\/\//, "").slice(0, 30)}</a>
                            ) : "-"}
                          </td>
                          <td>{formatDate(c.createdAt)}</td>
                          <td>
                            <div className="admin-action-group">
                              <button className="admin-action-btn" title="Edit" onClick={() => startEditCompany(c)}>
                                <i className="bx bx-edit"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {companies.length === 0 && (
                        <tr><td colSpan="7" className="admin-empty">No companies found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={companiesPage} setPage={setCompaniesPage} total={companiesTotal} />

              {/* Edit Company Modal */}
              {editingCompany && (
                <div className="admin-modal-overlay" onClick={() => setEditingCompany(null)}>
                  <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-modal-header">
                      <h3>Edit Company</h3>
                      <button onClick={() => setEditingCompany(null)} className="admin-modal-close">
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                    <div className="admin-modal-body">
                      <label>Name</label>
                      <input type="text" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      <label>Website URL</label>
                      <input type="url" value={editForm.url || ""} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} />
                      <label>Description</label>
                      <textarea rows="3" value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}></textarea>
                      <div className="admin-form-row">
                        <div>
                          <label>City</label>
                          <input type="text" value={editForm.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                        </div>
                        <div>
                          <label>Country</label>
                          <input type="text" value={editForm.country || ""} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
                        </div>
                      </div>
                      <label>Category</label>
                      <select value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value, subcategory: "" })}>
                        <option value="">Select Category</option>
                        {allCategories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                      <label>Subcategory</label>
                      <select value={editForm.subcategory || ""} onChange={(e) => setEditForm({ ...editForm, subcategory: e.target.value })}>
                        <option value="">Select Subcategory</option>
                        {allCategories
                          .find((c) => c._id === editForm.category)
                          ?.subcategories?.map((sub) => (
                            <option key={sub._id} value={sub._id}>{sub.name}</option>
                          ))}
                      </select>
                    </div>
                    <div className="admin-modal-footer">
                      <button className="admin-btn-secondary" onClick={() => setEditingCompany(null)}>Cancel</button>
                      <button className="admin-btn-primary" onClick={saveCompany}>Save Changes</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── REVIEWS ─────────────────────────── */}
          {activeSection === "reviews" && (
            <div className="admin-section">
              <div className="admin-toolbar">
                <div className="admin-search-box">
                  <i className="bx bx-search"></i>
                  <input
                    type="text"
                    placeholder="Search reviews by company, user, or content..."
                    value={reviewsSearch}
                    onChange={(e) => setReviewsSearch(e.target.value)}
                  />
                </div>
                {selectedReviews.length > 0 && (
                  <button className="admin-bulk-btn admin-bulk-delete" onClick={bulkDeleteReviews}>
                    <i className="bx bx-trash"></i> Delete {selectedReviews.length} selected
                  </button>
                )}
              </div>

              {loading ? (
                <div className="admin-loading"><div className="admin-spinner"></div></div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={reviews.length > 0 && selectedReviews.length === reviews.length}
                            onChange={() => toggleSelectAll(reviews, selectedReviews, setSelectedReviews)}
                          />
                        </th>
                        <th>Company</th>
                        <th>User</th>
                        <th>Rating</th>
                        <th>Review</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((r) => (
                        <tr key={r._id} className={selectedReviews.includes(r._id) ? "selected" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedReviews.includes(r._id)}
                              onChange={() => toggleSelect(selectedReviews, setSelectedReviews, r._id)}
                            />
                          </td>
                          <td>
                            <div className="admin-company-cell">
                              <img
                                src={r.company?.logo || "https://via.placeholder.com/24?text=Co"}
                                alt=""
                                className="admin-company-logo-sm"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/24?text=Co"; }}
                              />
                              <span>{r.company?.name || "Deleted"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-user-cell">
                              <img
                                src={r.user?.profileImage || "https://avatar.iran.liara.run/public"}
                                alt=""
                                className="admin-avatar-sm"
                              />
                              <span>{r.user?.name || "Deleted"}</span>
                            </div>
                          </td>
                          <td><StarDisplay rating={r.rating} /></td>
                          <td className="admin-review-cell">
                            <strong>{r.title}</strong>
                            <p>{r.comment?.slice(0, 80)}{r.comment?.length > 80 ? "..." : ""}</p>
                          </td>
                          <td>{formatDate(r.createdAt)}</td>
                          <td>
                            <button className="admin-action-btn admin-delete-btn" title="Delete" onClick={() => deleteReview(r._id)}>
                              <i className="bx bx-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {reviews.length === 0 && (
                        <tr><td colSpan="7" className="admin-empty">No reviews found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={reviewsPage} setPage={setReviewsPage} total={reviewsTotal} />
            </div>
          )}

          {/* ── CATEGORIES ──────────────────────── */}
          {activeSection === "categories" && (
            <div className="admin-section">
              {/* Add new */}
              <div className="admin-cat-forms">
                <div className="admin-cat-form-card">
                  <h4>Add Category</h4>
                  <div className="admin-cat-form-row">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button className="admin-btn-primary" onClick={addCategory}>Add</button>
                  </div>
                </div>
                <div className="admin-cat-form-card">
                  <h4>Add Subcategory</h4>
                  <div className="admin-cat-form-row">
                    <select value={newSubcategoryParent} onChange={(e) => setNewSubcategoryParent(e.target.value)}>
                      <option value="">Parent category...</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Subcategory name"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                    />
                    <button className="admin-btn-primary" onClick={addSubcategory}>Add</button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="admin-loading"><div className="admin-spinner"></div></div>
              ) : (
                <div className="admin-categories-list">
                  {categories.map((cat) => (
                    <div key={cat._id} className="admin-cat-card">
                      <div className="admin-cat-header">
                        {editingCategory === cat._id ? (
                          <div className="admin-cat-edit-row">
                            <input
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              autoFocus
                            />
                            <button className="admin-btn-primary admin-btn-sm" onClick={() => saveCategory(cat._id)}>Save</button>
                            <button className="admin-btn-secondary admin-btn-sm" onClick={() => setEditingCategory(null)}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <div className="admin-cat-name-group">
                              <h3>{cat.name}</h3>
                              <span className="admin-cat-count">{cat.companyCount} companies</span>
                            </div>
                            <div className="admin-cat-actions">
                              <button className="admin-action-btn" title="Rename" onClick={() => { setEditingCategory(cat._id); setEditCategoryName(cat.name); }}>
                                <i className="bx bx-edit"></i>
                              </button>
                              <button className="admin-action-btn admin-delete-btn" title="Delete" onClick={() => deleteCategory(cat._id)}>
                                <i className="bx bx-trash"></i>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="admin-subcats">
                          {cat.subcategories.map((sub) => (
                            <div key={sub._id} className="admin-subcat-row">
                              {editingSubcategory === sub._id ? (
                                <div className="admin-cat-edit-row">
                                  <input
                                    type="text"
                                    value={editSubcategoryName}
                                    onChange={(e) => setEditSubcategoryName(e.target.value)}
                                    autoFocus
                                  />
                                  <button className="admin-btn-primary admin-btn-sm" onClick={() => saveSubcategory(sub._id)}>Save</button>
                                  <button className="admin-btn-secondary admin-btn-sm" onClick={() => setEditingSubcategory(null)}>Cancel</button>
                                </div>
                              ) : (
                                <>
                                  <span className="admin-subcat-name">{sub.name}</span>
                                  <div className="admin-cat-actions">
                                    <button className="admin-action-btn" title="Rename" onClick={() => { setEditingSubcategory(sub._id); setEditSubcategoryName(sub.name); }}>
                                      <i className="bx bx-edit"></i>
                                    </button>
                                    <button className="admin-action-btn admin-delete-btn" title="Delete" onClick={() => deleteSubcategory(sub._id)}>
                                      <i className="bx bx-trash"></i>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
