import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "./adminHelpers.jsx";
import { useToast } from "../Toast.jsx";
import ButtonSpinner from "../ButtonSpinner.jsx";

const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon",
  "Cape Verde", "Central African Republic", "Chad", "Comoros", "Congo",
  "DR Congo", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini",
  "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast",
  "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali",
  "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria",
  "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone",
  "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia",
  "Uganda", "Zambia", "Zimbabwe",
];

/**
 * Admin: search Google Places and import businesses as companies.
 * Imported companies keep their Google place ID, so their company page
 * shows the live Google rating and up to 5 Google reviews.
 */
export default function AdminGoogleImport() {
  const showToast = useToast();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null); // null = no search yet
  const [categories, setCategories] = useState([]);
  const [categoryChoice, setCategoryChoice] = useState({}); // placeId -> category name
  const [rowState, setRowState] = useState({}); // placeId -> { status, slug?, error? }
  const [bulkRunning, setBulkRunning] = useState(false);

  // Re-run after imports too: importing can create a missing category
  const loadCategories = useCallback(() => {
    adminApi("/admin/categories")
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const categoryNames = new Set(categories.map((c) => c.name));

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim() || bulkRunning) return;
    setSearching(true);
    try {
      const data = await adminApi("/google/search", {
        method: "POST",
        body: { query: query.trim(), country: country.trim() },
      });
      const found = data.results || [];
      setResults(found);
      setCategoryChoice(
        Object.fromEntries(found.map((r) => [r.placeId, r.suggestedCategory]))
      );
      setRowState(
        Object.fromEntries(
          found
            .filter((r) => r.alreadyImported)
            .map((r) => [r.placeId, { status: "exists", slug: r.companySlug }])
        )
      );
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSearching(false);
    }
  };

  // Returns "imported", "exists" or "error"
  const importOne = async (place) => {
    setRowState((prev) => ({ ...prev, [place.placeId]: { status: "importing" } }));
    try {
      const data = await adminApi("/google/import", {
        method: "POST",
        // Only send a category the site has; otherwise the server auto-detects
        body: {
          placeId: place.placeId,
          categoryOverride: categoryNames.has(categoryChoice[place.placeId])
            ? categoryChoice[place.placeId]
            : undefined,
        },
      });
      setRowState((prev) => ({
        ...prev,
        [place.placeId]: { status: "imported", slug: data.company?.slug },
      }));
      return "imported";
    } catch (err) {
      // 409: someone imported it after this search ran
      if (err.status === 409) {
        setRowState((prev) => ({
          ...prev,
          [place.placeId]: { status: "exists", slug: err.data?.companySlug },
        }));
        return "exists";
      }
      setRowState((prev) => ({ ...prev, [place.placeId]: { status: "error", error: err.message } }));
      return "error";
    }
  };

  const importSingle = async (place) => {
    if ((await importOne(place)) === "imported") loadCategories();
  };

  const pending = (results || []).filter((r) => {
    const status = rowState[r.placeId]?.status;
    return status !== "exists" && status !== "imported";
  });

  const importAll = async () => {
    setBulkRunning(true);
    const counts = { imported: 0, exists: 0, error: 0 };
    // One at a time: keeps Google usage predictable and shows progress per row.
    // Search and category pickers are locked meanwhile, so `pending` and
    // `categoryChoice` can't change under this loop.
    for (const place of pending) {
      counts[await importOne(place)]++;
    }
    setBulkRunning(false);
    loadCategories();
    const parts = [`Imported ${counts.imported}`];
    if (counts.exists) parts.push(`${counts.exists} already on site`);
    if (counts.error) parts.push(`${counts.error} failed`);
    showToast(parts.join(", "), counts.error ? "error" : "success");
  };

  return (
    <div>
      <div className="admin-cat-form-card admin-gimport-form">
        <h4>Find businesses on Google</h4>
        <form className="admin-cat-form-row admin-gimport-row" onSubmit={search}>
          <input
            type="text"
            placeholder="What kind of business? e.g. banks, pharmacies, hotels in Lekki"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={bulkRunning}
            aria-label="Business type or name"
          />
          <input
            type="text"
            list="admin-gimport-countries"
            placeholder="Country (optional)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={bulkRunning}
            aria-label="Country"
            className="admin-gimport-country"
          />
          <datalist id="admin-gimport-countries">
            {AFRICAN_COUNTRIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button type="submit" className="admin-btn-primary" disabled={searching || bulkRunning || !query.trim()}>
            {searching ? <ButtonSpinner size="w-4 h-4" color="border-white" /> : <><i className="bx bx-search"></i> Search</>}
          </button>
        </form>
        <p className="admin-gimport-hint">
          Each search and each import uses your Google Places quota. Imported companies show their
          Google rating and up to 5 Google reviews on their page.
        </p>
      </div>

      {results && (
        <>
          <div className="admin-toolbar admin-gimport-toolbar">
            <span className="admin-gimport-count">
              {results.length} result{results.length !== 1 ? "s" : ""}
              {results.length > 0 && ` · ${pending.length} not on the site yet`}
            </span>
            {pending.length > 0 && (
              <button className="admin-btn-primary" onClick={importAll} disabled={bulkRunning}>
                {bulkRunning ? <ButtonSpinner size="w-4 h-4" color="border-white" /> : <><i className="bx bx-import"></i> Import all {pending.length}</>}
              </button>
            )}
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr>
                    <td colSpan={3} className="admin-empty">No businesses found. Try different words.</td>
                  </tr>
                )}
                {results.map((place) => {
                  const state = rowState[place.placeId] || {};
                  const done = state.status === "exists" || state.status === "imported";
                  const chosen = categoryChoice[place.placeId] || "";
                  return (
                    <tr key={place.placeId}>
                      <td>
                        <div className="admin-gimport-name">{place.name}</div>
                        <div className="admin-gimport-sub">{place.address}</div>
                      </td>
                      <td>
                        <select
                          className="admin-gimport-select"
                          value={categoryNames.has(chosen) ? chosen : ""}
                          disabled={done || bulkRunning || state.status === "importing"}
                          onChange={(e) =>
                            setCategoryChoice((prev) => ({ ...prev, [place.placeId]: e.target.value }))
                          }
                          aria-label={`Category for ${place.name}`}
                        >
                          <option value="">Auto-detect</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {done ? (
                          <span className="admin-gimport-status">
                            <span className="admin-badge admin-badge-imported">
                              {state.status === "exists" ? "Already on site" : "Imported"}
                            </span>
                            {state.slug && (
                              <Link to={`/company/${state.slug}`} target="_blank" rel="noopener noreferrer">
                                View <i className="bx bx-link-external"></i>
                              </Link>
                            )}
                          </span>
                        ) : (
                          <span className="admin-gimport-status">
                            <button
                              className="admin-btn-primary admin-btn-sm"
                              onClick={() => importSingle(place)}
                              disabled={bulkRunning || state.status === "importing"}
                            >
                              {state.status === "importing" ? <ButtonSpinner size="w-4 h-4" color="border-white" /> : state.status === "error" ? "Retry" : "Import"}
                            </button>
                            {state.status === "error" && (
                              <span className="admin-gimport-error">{state.error}</span>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
