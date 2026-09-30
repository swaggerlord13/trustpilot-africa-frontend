import { useState } from "react";
import api from "../../api.js";
import { useAuth } from "../AuthProvider.jsx";
import { useToast } from "../Toast.jsx";

export default function CompanyClaimModal({ company, onClose, onClaimSubmitted }) {
  const showToast = useToast();
  const [claimForm, setClaimForm] = useState({ role: "owner", reason: "", jobTitle: "" });
  const [claimLoading, setClaimLoading] = useState(false);

  const handleSubmitClaim = async () => {
    if (!claimForm.reason.trim()) {
      showToast("Please provide a reason for your claim.", "warning");
      return;
    }
    setClaimLoading(true);
    try {
      await api.post(
        "/company-claims",
        {
          companyId: company._id,
          role: claimForm.role,
          reason: claimForm.reason,
          jobTitle: claimForm.jobTitle,
        }
      );
      onClaimSubmitted("pending");
      onClose();
    } catch (err) {
      console.error("Claim error:", err);
      showToast(err.response?.data?.message || "Failed to submit claim", "error");
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4" style={{ zIndex: 200 }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            <i className="bx bx-badge-check text-brand-500 mr-2"></i>
            Claim {company.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl">
            &times;
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Claiming this company lets you respond to reviews, see analytics, and update your company profile. An admin will review your claim.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Role</label>
            <select
              value={claimForm.role}
              onChange={(e) => setClaimForm({ ...claimForm, role: e.target.value })}
              className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:border-brand-500 outline-none text-slate-800 dark:text-slate-100"
            >
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="representative">Representative</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title (optional)</label>
            <input
              type="text"
              value={claimForm.jobTitle}
              onChange={(e) => setClaimForm({ ...claimForm, jobTitle: e.target.value })}
              placeholder="e.g. CEO, Marketing Manager"
              className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:border-brand-500 outline-none text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Why are you claiming this company? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={claimForm.reason}
              onChange={(e) => setClaimForm({ ...claimForm, reason: e.target.value })}
              rows="3"
              placeholder="Explain your relationship with this company..."
              className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:border-brand-500 outline-none resize-none text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitClaim}
            disabled={claimLoading || !claimForm.reason.trim()}
            className="flex-1 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 font-semibold"
          >
            {claimLoading ? "Submitting..." : "Submit Claim"}
          </button>
        </div>
      </div>
    </div>
  );
}
