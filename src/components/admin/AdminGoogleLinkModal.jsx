import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "./adminHelpers.jsx";
import ButtonSpinner from "../ButtonSpinner.jsx";

/**
 * Admin: pick which Google place an existing company is, so its page shows
 * the Google rating and reviews. Linking only fills empty website/address/
 * phone; the company's name, city and country are never changed.
 */
export default function AdminGoogleLinkModal({ company, onClose, onLinked }) {
  const [candidates, setCandidates] = useState(null);
  const [error, setError] = useState("");
  const [linkingId, setLinkingId] = useState(null);

  useEffect(() => {
    let ignore = false;
    adminApi(`/google/link-candidates/${company._id}`)
      .then((data) => {
        if (!ignore) setCandidates(data.candidates || []);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [company._id]);

  const link = async (placeId) => {
    setLinkingId(placeId);
    setError("");
    try {
      const data = await adminApi(`/google/link/${company._id}`, { method: "POST", body: { placeId } });
      onLinked(data.company);
    } catch (err) {
      setError(err.message);
      setLinkingId(null);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>Link "{company.name}" to Google</h3>
          <button onClick={onClose} className="admin-modal-close" aria-label="Close">
            <i className="bx bx-x"></i>
          </button>
        </div>
        <div className="admin-modal-body">
          <p className="admin-gimport-hint" style={{ marginTop: 0 }}>
            Pick the same business. Its page will then show the Google rating and up to 5 Google
            reviews, and any empty website, address or phone is filled in.
          </p>

          {error && <p className="admin-gimport-error">{error}</p>}

          {!candidates && !error && (
            <div className="admin-glink-loading">
              <ButtonSpinner /> Searching Google…
            </div>
          )}

          {candidates && candidates.length === 0 && (
            <p className="admin-gimport-hint">
              No matches on Google. Check the company's name, city and country, then try again.
            </p>
          )}

          {candidates && candidates.length > 0 && (
            <ul className="admin-glink-list">
              {candidates.map((c) => (
                <li key={c.placeId} className="admin-glink-item">
                  <div className="admin-glink-info">
                    <div className="admin-gimport-name">{c.name}</div>
                    <div className="admin-gimport-sub">{c.address}</div>
                    <div className="admin-glink-tags">
                      <span className={`admin-badge ${c.nameScore >= 0.85 ? "admin-badge-imported" : "admin-badge-user"}`}>
                        Name match {Math.round(c.nameScore * 100)}%
                      </span>
                      {!c.locationMatch && (
                        <span className="admin-badge admin-badge-cat">Different location</span>
                      )}
                    </div>
                  </div>
                  {c.linkedTo ? (
                    <span className="admin-gimport-sub">
                      Linked to{" "}
                      <Link to={`/company/${c.linkedTo.slug}`} target="_blank" rel="noopener noreferrer">
                        {c.linkedTo.name}
                      </Link>
                    </span>
                  ) : (
                    <button
                      className="admin-btn-primary admin-btn-sm"
                      onClick={() => link(c.placeId)}
                      disabled={Boolean(linkingId)}
                    >
                      {linkingId === c.placeId ? <ButtonSpinner size="w-4 h-4" color="border-white" /> : "Link"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
