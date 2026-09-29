import { useState, useEffect, useCallback } from "react";
import { adminApi, formatDate, Pagination, toggleSelect, toggleSelectAll } from "./adminHelpers.jsx";
import { useToast } from "../Toast.jsx";

export default function AdminCompanies() {
  const showToast = useToast();
  const [companies, setCompanies] = useState([]);
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCompanies = useCallback(async (pg, search) => {
    setLoading(true);
    try {
      const data = await adminApi(`/admin/companies?page=${pg}&limit=15&search=${encodeURIComponent(search)}`);
      setCompanies(data.companies);
      setCompaniesTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllCategories = useCallback(async () => {
    try {
      const data = await adminApi("/admin/categories");
      setAllCategories(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchCompanies(companiesPage, companiesSearch);
    fetchAllCategories();
  }, [companiesPage]);

  useEffect(() => {
    const t = setTimeout(() => { setCompaniesPage(1); fetchCompanies(1, companiesSearch); }, 400);
    return () => clearTimeout(t);
  }, [companiesSearch]);

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
      await adminApi(`/admin/companies/${editingCompany}`, {
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
      await adminApi("/admin/companies/bulk", {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedCompanies }),
      });
      showToast(`${selectedCompanies.length} company(ies) deleted`, "success");
      setSelectedCompanies([]);
      fetchCompanies(companiesPage, companiesSearch);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
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
                        src={c.logo || ""}
                        alt=""
                        className="admin-company-logo"
                        onError={(e) => { e.target.src = ""; }}
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
  );
}
