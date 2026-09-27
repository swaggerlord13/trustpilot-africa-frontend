// src/components/AddCompanyModal.jsx
import React, { useState } from "react";
import { useToast } from "../components/Toast.jsx";

export default function AddCompanyModal({ 
  isOpen, 
  onClose, 
  defaultName, 
  onAddCompany // This should come from parent component
}) {
  const showToast = useToast();
  const [name, setName] = useState(defaultName || "");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("Company name is required.", "warning");
      return;
    }

    setLoading(true);

    try {
      // Use parent's onAddCompany function instead of direct API call
      await onAddCompany({
        name: name.trim(),
        url: url.trim()
      });
      
      // Reset form
      setName("");
      setUrl("");
    } catch (err) {
      console.error("Modal error:", err);
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal opens with new default name
  React.useEffect(() => {
    if (isOpen && defaultName) {
      setName(defaultName);
      setUrl("");
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center" style={{ zIndex: 200 }}>
      <div className="bg-white rounded-xl shadow-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">Add New Company</h2>
        
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Company Name"
          className="w-full border rounded-lg px-3 py-2 mb-4"
          disabled={loading}
        />
        
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Company URL (optional)"
          className="w-full border rounded-lg px-3 py-2 mb-4"
          disabled={loading}
        />
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg border hover:bg-gray-100"
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
