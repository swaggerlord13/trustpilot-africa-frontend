import { useState, useEffect, useCallback, useRef } from "react";
import { adminApi, formatDate } from "./adminHelpers.jsx";
import { useToast } from "../Toast.jsx";
import Loader from "../Loader.jsx";
import CompanyLogo from "../CompanyLogo";
import AdminBrandLocations from "./AdminBrandLocations.jsx";

// Empty form used when creating a brand
const EMPTY_FORM = { name: "", website: "", logo: "", description: "", category: "" };

/**
 * Admin: list, search, create, edit and delete brands, and open a brand to
 * manage which locations (companies) belong to it.
 */
export default function AdminBrands() {
  // Toast messages for success/error feedback
  const showToast = useToast();
  // Brands on the current page
  const [brands, setBrands] = useState([]);
  // Total pages, for the Prev/Next buttons
  const [totalPages, setTotalPages] = useState(1);
  // Current page number
  const [page, setPage] = useState(1);
  // Search box text
  const [search, setSearch] = useState("");
  // Loading state for the table
  const [loading, setLoading] = useState(false);
  // Categories for the category dropdown
  const [categories, setCategories] = useState([]);
  // null = form closed, "new" = creating, or the brand being edited
  const [editing, setEditing] = useState(null);
  // Form field values
  const [form, setForm] = useState(EMPTY_FORM);
  // True while the form is saving
  const [saving, setSaving] = useState(false);
  // Brand whose locations are being managed (opens the locations dialog)
  const [managing, setManaging] = useState(null);

  // Number of the newest list request; older answers that arrive late are ignored
  const requestId = useRef(0);
  // Page and search shown right now; a save/delete that finishes later
  // refreshes these, not the ones from when the button was clicked
  const viewRef = useRef({ page, search });
  viewRef.current = { page, search };
  // Reload the list exactly as it is shown now
  const refreshCurrent = () => fetchBrands(viewRef.current.page, viewRef.current.search);

  // Load one page of brands for the current search
  const fetchBrands = useCallback(async (pg, term) => {
    // This request's number
    const id = ++requestId.current;
    // Show the loader while fetching
    setLoading(true);
    try {
      // Admin list endpoint with paging and search
      const data = await adminApi(`/admin/brands?page=${pg}&search=${encodeURIComponent(term)}`);
      // A newer request was sent meanwhile: its answer wins
      if (id !== requestId.current) return;
      // Pages that exist now (at least 1)
      const pages = Math.max(1, data.totalPages || 1);
      // This page no longer exists (e.g. its last brand was deleted): go to the last page
      if (pg > pages) {
        // Show the last page and load it now (if the page number already
        // equals it, setPage alone would not reload and the loader would stick)
        setPage(pages);
        return fetchBrands(pages, term);
      }
      // Store the brands and the page count
      setBrands(data.brands || []);
      setTotalPages(pages);
      // Done loading (only the newest request turns the loader off)
      setLoading(false);
    } catch (err) {
      // An older request failing doesn't matter any more
      if (id !== requestId.current) return;
      // Tell the admin what went wrong
      showToast(err.message, "error");
      setLoading(false);
    }
  }, [showToast]);

  // Load categories once for the dropdown
  useEffect(() => {
    adminApi("/admin/categories")
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  // Reload when the page changes, and 400ms after typing stops in search
  useEffect(() => {
    // Wait a moment so we don't query on every keystroke
    const timer = setTimeout(() => fetchBrands(page, search), 400);
    // Cancel the pending query if the user keeps typing
    return () => clearTimeout(timer);
  }, [page, search, fetchBrands]);

  // Open the form for a new brand
  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditing("new");
  };

  // Open the form filled with an existing brand's values
  const startEdit = (brand) => {
    setForm({
      name: brand.name || "",
      website: brand.website || "",
      logo: brand.logo || "",
      description: brand.description || "",
      category: brand.category?._id || "",
    });
    setEditing(brand);
  };

  // Save the form: POST for a new brand, PUT for an existing one
  const saveBrand = async (e) => {
    // Keep the browser from reloading the page
    e.preventDefault();
    setSaving(true);
    try {
      // Creating or updating?
      const isNew = editing === "new";
      // Send the form to the right endpoint
      await adminApi(isNew ? "/admin/brands" : `/admin/brands/${editing._id}`, {
        method: isNew ? "POST" : "PUT",
        body: form,
      });
      showToast(isNew ? "Brand created" : "Brand updated", "success");
      // Close the form and refresh the list
      setEditing(null);
      refreshCurrent();
    } catch (err) {
      // e.g. "A brand with this name already exists"
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete a brand after confirmation (its locations are kept)
  const deleteBrand = async (brand) => {
    // Make sure the admin really means it
    if (!window.confirm(`Delete the brand "${brand.name}"? Its ${brand.locationCount} location(s) are kept, just without a brand.`)) return;
    try {
      await adminApi(`/admin/brands/${brand._id}`, { method: "DELETE" });
      showToast("Brand deleted", "success");
      refreshCurrent();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Update one form field from an input's change event
  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="admin-section">
      {/* Search box and "New brand" button */}
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <i className="bx bx-search"></i>
          <input
            type="text"
            placeholder="Search brands by name..."
            value={search}
            onChange={(e) => {
              // New search starts from page 1
              setPage(1);
              setSearch(e.target.value);
            }}
            aria-label="Search brands"
          />
        </div>
        <button className="admin-btn-primary" onClick={startCreate}>
          <i className="bx bx-plus"></i> New brand
        </button>
      </div>

      {/* Brands table, or a loader while fetching */}
      {loading ? (
        <Loader />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Category</th>
                <th>Locations</th>
                <th>Website</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b._id}>
                  {/* Logo (falls back to favicon) and name */}
                  <td>
                    <div className="admin-company-cell">
                      <CompanyLogo logo={b.logo} url={b.website} name={b.name} size={32} />
                      <span>{b.name}</span>
                    </div>
                  </td>
                  {/* Category badge */}
                  <td>
                    <span className="admin-badge admin-badge-cat">{b.category?.name || "-"}</span>
                  </td>
                  {/* Number of locations; clicking opens the manager */}
                  <td>
                    <button className="admin-btn-secondary admin-btn-sm" onClick={() => setManaging(b)}>
                      {b.locationCount} · Manage
                    </button>
                  </td>
                  {/* Website without the https:// prefix */}
                  <td className="admin-url-cell">
                    {b.website ? (
                      <a href={b.website} target="_blank" rel="noopener noreferrer">
                        {b.website.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 30)}
                      </a>
                    ) : "-"}
                  </td>
                  {/* Created date */}
                  <td>{formatDate(b.createdAt)}</td>
                  {/* Edit / view page / delete */}
                  <td>
                    <div className="admin-action-group">
                      <button className="admin-action-btn" title="Edit" onClick={() => startEdit(b)}>
                        <i className="bx bx-edit"></i>
                      </button>
                      <a className="admin-action-btn" title="View brand page" href={`/brand/${b.slug}`} target="_blank" rel="noopener noreferrer">
                        <i className="bx bx-link-external"></i>
                      </a>
                      <button className="admin-action-btn" title="Delete" onClick={() => deleteBrand(b)}>
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty state */}
              {brands.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-empty">
                    No brands yet. Create one, or run the grouping script on the server.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple Prev/Next paging */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <i className="bx bx-chevron-left"></i> Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next <i className="bx bx-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Create / edit form in a dialog */}
      {editing && (
        <div className="admin-modal-overlay" onClick={() => setEditing(null)}>
          <form className="admin-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveBrand}>
            <div className="admin-modal-header">
              <h3>{editing === "new" ? "New brand" : `Edit "${editing.name}"`}</h3>
              <button type="button" onClick={() => setEditing(null)} className="admin-modal-close" aria-label="Close">
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <label htmlFor="brand-name">Name</label>
              <input id="brand-name" type="text" required maxLength={100} value={form.name} onChange={setField("name")} placeholder="e.g. MTN" />
              <label htmlFor="brand-website">Website</label>
              <input id="brand-website" type="text" value={form.website} onChange={setField("website")} placeholder="e.g. mtn.ng" />
              <label htmlFor="brand-logo">Logo URL (optional)</label>
              <input id="brand-logo" type="text" value={form.logo} onChange={setField("logo")} placeholder="Leave empty to use the website icon" />
              <label htmlFor="brand-category">Category</label>
              <select id="brand-category" value={form.category} onChange={setField("category")}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <label htmlFor="brand-description">Description</label>
              <textarea id="brand-description" rows="3" maxLength={2000} value={form.description} onChange={setField("description")}></textarea>
              <p className="admin-gimport-hint">
                Locations whose website matches this one join the brand when they are imported or linked from Google.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="admin-btn-primary" disabled={saving || !form.name.trim()}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage locations dialog; refresh counts when it closes */}
      {managing && (
        <AdminBrandLocations
          brand={managing}
          onClose={() => {
            setManaging(null);
            refreshCurrent();
          }}
        />
      )}
    </div>
  );
}
