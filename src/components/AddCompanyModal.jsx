// src/components/AddCompanyModal.jsx
import React, { useState, useEffect } from "react";
import { useToast } from "../components/Toast.jsx";

export default function AddCompanyModal({ 
  isOpen, 
  onClose, 
  defaultName, 
  onAddCompany
}) {
  const showToast = useToast();
  const [name, setName] = useState(defaultName || "");
  const [url, setUrl] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("Company name is required.", "warning");
      return;
    }
    if (!country.trim()) {
      showToast("Country is required to prevent duplicates.", "warning");
      return;
    }
    if (!city.trim()) {
      showToast("City is required to prevent duplicates.", "warning");
      return;
    }

    setLoading(true);
    setDuplicateError(null);

    try {
      await onAddCompany({
        name: name.trim(),
        url: url.trim(),
        city: city.trim(),
        country: country.trim(),
      });
      
      setName("");
      setUrl("");
      setCity("");
      setCountry("");
    } catch (err) {
      console.error("Modal error:", err);
      if (err.response && err.response.status === 409 && err.response.data.duplicates) {
        setDuplicateError(err.response.data.duplicates);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && defaultName) {
      setName(defaultName);
      setUrl("");
      setCity("");
      setCountry("");
      setDuplicateError(null);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center" style={{ zIndex: 200 }}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-[28rem] max-w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Add New Company</h2>

        {duplicateError && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">Similar company found:</p>
            {duplicateError.map((dup, i) => (
              <p key={i}>{dup.message}</p>
            ))}
          </div>
        )}
        
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Company Name *"
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 mb-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country *"
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            disabled={loading}
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City *"
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            disabled={loading}
          />
        </div>
        
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Company Website (optional)"
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 mb-4 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          disabled={loading}
        />

        <p className="text-xs text-slate-400 mb-4">
          City and country help us keep companies unique. A restaurant in Lagos and one in Nairobi are separate listings.
        </p>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Company"}
          </button>
        </div>
      </div>
    </div>
  );
}
