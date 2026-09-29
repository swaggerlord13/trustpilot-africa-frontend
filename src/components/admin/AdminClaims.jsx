import { useState, useEffect, useCallback } from "react";
import { adminApi, formatDate } from "./adminHelpers";
import { useToast } from "../Toast.jsx";

export default function AdminClaims() {
  const showToast = useToast();
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);

  const fetchClaims = useCallback(async () => {
    setClaimsLoading(true);
    try {
      const data = await adminApi("/company-claims/pending");
      setClaims(data.claims || []);
    } catch (err) {
      console.error(err);
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, []);

  const approveClaim = async (id) => {
    try {
      await adminApi(`/company-claims/${id}/approve`, { method: "PUT" });
      showToast("Claim approved", "success");
      fetchClaims();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const rejectClaim = async (id) => {
    if (!window.confirm("Reject this claim? The user will not get access to the company dashboard.")) return;
    try {
      await adminApi(`/company-claims/${id}/reject`, { method: "PUT" });
      showToast("Claim rejected", "success");
      fetchClaims();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <p style={{ color: "#64748B", fontSize: "14px" }}>
          <i className="bx bx-info-circle" style={{ marginRight: "4px" }}></i>
          Review and approve company ownership claims from users.
        </p>
      </div>

      {claimsLoading ? (
        <div className="admin-loading"><div className="admin-spinner"></div></div>
      ) : claims.length === 0 ? (
        <div className="admin-empty-state" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "14px",
            background: "#F0FDF4", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 1rem"
          }}>
            <i className="bx bx-check-circle" style={{ fontSize: "28px", color: "#22C55E" }}></i>
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1E293B", marginBottom: "4px" }}>All caught up!</h3>
          <p style={{ color: "#64748B", fontSize: "14px" }}>No pending company claims to review right now.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Claimed By</th>
                <th>Role</th>
                <th>Job Title</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim._id}>
                  <td>
                    <div className="admin-company-cell">
                      <img
                        src={claim.company?.logo || ""}
                        alt=""
                        className="admin-company-logo"
                        onError={(e) => { e.target.src = ""; }}
                      />
                      <span>{claim.company?.name || "Unknown"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-user-cell">
                      <img
                        src={claim.user?.profileImage || "https://avatar.iran.liara.run/public"}
                        alt=""
                        className="admin-avatar"
                      />
                      <div>
                        <span style={{ display: "block", fontWeight: "600" }}>{claim.user?.name || "Unknown"}</span>
                        <span style={{ fontSize: "12px", color: "#64748B" }}>{claim.user?.email || ""}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-cat" style={{ textTransform: "capitalize" }}>
                      {claim.role}
                    </span>
                  </td>
                  <td>{claim.jobTitle || "-"}</td>
                  <td className="admin-review-cell">
                    <p>{claim.reason?.slice(0, 100)}{claim.reason?.length > 100 ? "..." : ""}</p>
                  </td>
                  <td>{formatDate(claim.createdAt)}</td>
                  <td>
                    <div className="admin-action-group" style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="admin-btn-primary admin-btn-sm"
                        onClick={() => approveClaim(claim._id)}
                        title="Approve"
                        style={{ background: "#22C55E", border: "none", color: "white", padding: "6px 12px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                      >
                        <i className="bx bx-check" style={{ marginRight: "2px" }}></i> Approve
                      </button>
                      <button
                        className="admin-btn-secondary admin-btn-sm"
                        onClick={() => rejectClaim(claim._id)}
                        title="Reject"
                        style={{ background: "#FEE2E2", border: "none", color: "#DC2626", padding: "6px 12px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                      >
                        <i className="bx bx-x" style={{ marginRight: "2px" }}></i> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
