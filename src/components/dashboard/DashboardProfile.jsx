import { useState, useRef } from "react";
import api from "../../api.js";
import { useToast } from "../Toast.jsx";
import ButtonSpinner from "../ButtonSpinner.jsx";
import CompanyLogo from "../CompanyLogo";

export default function DashboardProfile({ company, setCompany, companyId }) {
  const showToast = useToast();
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    description: company?.description || "",
    url: company?.url || "",
    logo: company?.logo || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);


  const handleLogoUpload = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await api.post("/upload/company-logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success) {
        setProfileForm((prev) => ({ ...prev, logo: res.data.imageUrl }));
        showToast("Logo uploaded! Click Save to apply.", "success");
      }
    } catch (err) {
      console.error("Logo upload error:", err);
      showToast("Failed to upload logo", "error");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await api.put(
        `/company-dashboard/${companyId}/profile`,
        profileForm
      );
      setCompany((prev) => ({ ...prev, ...profileForm }));
      setEditMode(false);
      showToast("Company profile updated!", "success");
    } catch (err) {
      console.error("Profile save error:", err);
      showToast("Failed to update profile", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Company Profile</h3>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-semibold"
          >
            <i className="bx bx-edit mr-1"></i> Edit
          </button>
        )}
      </div>

      {editMode ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
            <textarea
              value={profileForm.description}
              onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
              rows="4"
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-brand-500 outline-none dark:bg-slate-700 resize-none text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Website URL</label>
            <input
              type="url"
              value={profileForm.url}
              onChange={(e) => setProfileForm({ ...profileForm, url: e.target.value })}
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-brand-500 outline-none dark:bg-slate-700 text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Company Logo</label>

            {profileForm.logo && (
              <div className="mb-3 flex justify-center">
                <img
                  src={profileForm.logo}
                  alt="Logo Preview"
                  className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-600"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            )}

            <input
              type="file"
              ref={logoInputRef}
              onChange={(e) => handleLogoUpload(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="w-full p-3 border-2 border-dashed border-slate-300 dark:border-slate-500 dark:bg-slate-700/50 rounded-lg hover:border-brand-400 transition-colors duration-200 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 disabled:opacity-50"
            >
              {logoUploading ? (
                <>
                  <ButtonSpinner />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="bx bx-camera text-lg"></i>
                  {profileForm.logo ? "Change Logo" : "Upload Logo"}
                </>
              )}
            </button>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setEditMode(false);
                setProfileForm({
                  description: company?.description || "",
                  url: company?.url || "",
                  logo: company?.logo || "",
                });
              }}
              className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={profileSaving}
              className="px-5 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 font-semibold"
            >
              {profileSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <CompanyLogo logo={company?.logo} url={company?.url} name={company?.name} size={64} />
            <div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{company?.name}</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{company?.category?.name || "General"}</p>
            </div>
          </div>
          {company?.description && (
            <div>
              <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
              <p className="text-slate-700 dark:text-slate-200 mt-1">{company.description}</p>
            </div>
          )}
          {company?.url && (
            <div>
              <label className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Website</label>
              <a href={company.url.startsWith("http") ? company.url : `https://${company.url}`} target="_blank" rel="noreferrer" className="text-brand-500 hover:text-brand-600 block mt-1">
                {company.url}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
