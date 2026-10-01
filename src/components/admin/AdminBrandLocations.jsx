import { useState, useEffect, useCallback } from "react";
import { adminApi } from "./adminHelpers.jsx";
import { useToast } from "../Toast.jsx";
import ButtonSpinner from "../ButtonSpinner.jsx";

// Locations loaded per "Load more" click (the server allows up to 50)
const PAGE_SIZE = 50;

// "Ikeja, Lagos, Nigeria" style line from whatever place fields exist
function placeLine(company) {
  // Skip empty parts so there are no stray commas
  return [company.city, company.state, company.country].filter(Boolean).join(", ") || "No location set";
}

/**
 * Admin dialog: see which locations belong to a brand, remove one, or attach
 * suggested companies (same website, or name starting with the brand name).
 */
export default function AdminBrandLocations({ brand, onClose }) {
  // Toast messages for success/error feedback
  const showToast = useToast();
  // Locations already in the brand
  const [locations, setLocations] = useState([]);
  // Total number of locations in the brand (for "Load more")
  const [total, setTotal] = useState(0);
  // Last page of locations loaded so far
  const [page, setPage] = useState(1);
  // True while loading the locations list
  const [loadingLocations, setLoadingLocations] = useState(true);
  // Suggested companies to attach (null until loaded)
  const [suggestions, setSuggestions] = useState(null);
  // Ids of the suggestions the admin ticked
  const [selected, setSelected] = useState(() => new Set());
  // True while the attach request runs
  const [attaching, setAttaching] = useState(false);
  // Id of the location currently being removed, so only its button spins
  const [removingId, setRemovingId] = useState(null);
  // Error shown inside the dialog (e.g. failed to load)
  const [error, setError] = useState("");

  // Load one page of the brand's locations; page 1 replaces, later pages append
  const loadLocations = useCallback(async (pg) => {
    setLoadingLocations(true);
    try {
      // Same list the public brand page uses, newest data each time
      const data = await adminApi(`/brands/${encodeURIComponent(brand.slug)}/locations?page=${pg}&limit=${PAGE_SIZE}`);
      // Replace on page 1, append on later pages
      setLocations((prev) => (pg === 1 ? data.locations : [...prev, ...data.locations]));
      // Remember the total and the page we are on
      setTotal(data.pagination?.total || 0);
      setPage(pg);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLocations(false);
    }
  }, [brand.slug]);

  // Load companies that look like they belong to this brand
  const loadSuggestions = useCallback(async () => {
    try {
      const data = await adminApi(`/admin/brands/${brand._id}/suggestions`);
      setSuggestions(data.companies || []);
      // Clear ticks; the list just changed
      setSelected(new Set());
    } catch (err) {
      setError(err.message);
      // Show "none" instead of a spinner forever
      setSuggestions([]);
    }
  }, [brand._id]);

  // Load both lists when the dialog opens
  useEffect(() => {
    loadLocations(1);
    loadSuggestions();
  }, [loadLocations, loadSuggestions]);

  // Close on Escape, like the other admin dialogs should
  useEffect(() => {
    // Close when Escape is pressed anywhere
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Stop listening when the dialog closes
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Tick or untick one suggestion
  const toggle = (id) => {
    setSelected((prev) => {
      // Copy so React sees a new Set
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Tick all suggestions, or untick all if they are all ticked already
  const toggleAll = () => {
    // Nothing to toggle yet
    if (!suggestions?.length) return;
    setSelected((prev) => (prev.size === suggestions.length ? new Set() : new Set(suggestions.map((c) => c._id))));
  };

  // Attach every ticked suggestion to the brand
  const attachSelected = async () => {
    setAttaching(true);
    setError("");
    try {
      const data = await adminApi(`/admin/brands/${brand._id}/locations`, {
        method: "POST",
        body: { companyIds: [...selected] },
      });
      showToast(`${data.attached} location(s) added to ${brand.name}`, "success");
      // Refresh both lists so the moved companies switch sides
      await Promise.all([loadLocations(1), loadSuggestions()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setAttaching(false);
    }
  };

  // Remove one location from the brand (the company page itself stays)
  const removeLocation = async (company) => {
    // Make sure the admin really means it
    if (!window.confirm(`Remove "${company.name}" from ${brand.name}? Its company page and reviews stay.`)) return;
    setRemovingId(company._id);
    setError("");
    try {
      await adminApi(`/admin/brands/${brand._id}/locations/${company._id}`, { method: "DELETE" });
      showToast("Location removed", "success");
      // Reload from page 1: removing a row shifts every later row up, so
      // continuing from the old page number would skip one on "Load more"
      await loadLocations(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal admin-modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-locations-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 id="brand-locations-title">Locations of {brand.name}</h3>
          <button type="button" onClick={onClose} className="admin-modal-close" aria-label="Close">
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div className="admin-modal-body">
          {/* Problems talking to the server */}
          {error && <p className="admin-gimport-error" role="alert">{error}</p>}

          {/* Current locations */}
          <h4 className="admin-brandloc-heading">In this brand ({total})</h4>
          {locations.length === 0 && !loadingLocations && (
            <p className="admin-gimport-hint">No locations yet. Add some from the suggestions below.</p>
          )}
          {locations.length > 0 && (
            <ul className="admin-glink-list">
              {locations.map((loc) => (
                <li key={loc._id} className="admin-glink-item">
                  <div className="admin-glink-info">
                    {/* Name links to the location's own page */}
                    <a className="admin-gimport-name" href={`/company/${loc.slug}`} target="_blank" rel="noopener noreferrer">
                      {loc.name}
                    </a>
                    <div className="admin-gimport-sub">{placeLine(loc)}</div>
                  </div>
                  <button
                    type="button"
                    className="admin-btn-secondary admin-btn-sm"
                    onClick={() => removeLocation(loc)}
                    disabled={removingId === loc._id}
                  >
                    {removingId === loc._id ? <ButtonSpinner /> : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* Spinner while loading, otherwise "Load more" when there are more */}
          {loadingLocations ? (
            <div className="admin-glink-loading"><ButtonSpinner /> Loading locations...</div>
          ) : (
            locations.length < total && (
              <button type="button" className="admin-btn-secondary admin-btn-sm admin-brandloc-more" onClick={() => loadLocations(page + 1)}>
                Load more
              </button>
            )
          )}

          {/* Suggested companies to attach */}
          <h4 className="admin-brandloc-heading">Suggestions</h4>
          <p className="admin-gimport-hint">
            Companies without a brand that share this brand's website, or whose name starts with "{brand.name}".
          </p>
          {suggestions === null && (
            <div className="admin-glink-loading"><ButtonSpinner /> Looking for matches...</div>
          )}
          {suggestions?.length === 0 && <p className="admin-gimport-hint">No suggestions right now.</p>}
          {suggestions?.length > 0 && (
            <>
              {/* Select all / none */}
              <label className="admin-brandloc-check admin-brandloc-all">
                <input
                  type="checkbox"
                  checked={selected.size === suggestions.length}
                  onChange={toggleAll}
                />
                Select all ({suggestions.length})
              </label>
              <ul className="admin-glink-list">
                {suggestions.map((c) => (
                  <li key={c._id} className="admin-glink-item">
                    {/* Whole row is clickable through the label */}
                    <label className="admin-brandloc-check">
                      <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggle(c._id)} />
                      <span className="admin-glink-info">
                        <span className="admin-gimport-name">{c.name}</span>
                        <span className="admin-gimport-sub">
                          {placeLine(c)}
                          {c.domain ? ` · ${c.domain}` : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="admin-modal-footer">
          <button type="button" className="admin-btn-secondary" onClick={onClose}>Done</button>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={attachSelected}
            disabled={attaching || selected.size === 0}
          >
            {attaching ? "Adding..." : `Add selected (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
