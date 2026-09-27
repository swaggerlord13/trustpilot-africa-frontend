import { API_BASE_URL } from "../config.js";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Footer from "../components/Footer.jsx";
import { useToast } from "../components/Toast.jsx";

export default function Add() {
  const showToast = useToast();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState("manage"); // "manage" or "claims"

  // Claims states
  const [pendingClaims, setPendingClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimActionLoading, setClaimActionLoading] = useState(null);
  
  // New states for selective loading
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [selectedCategoryForCompanies, setSelectedCategoryForCompanies] = useState("");
  const [selectedSubcategoryForCompanies, setSelectedSubcategoryForCompanies] = useState("");

  // Category Form
  const [categoryForm, setCategoryForm] = useState({ name: "" });

  // Subcategory Form
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    categoryId: "",
  });

  // Company Form
  const [companyForm, setCompanyForm] = useState({
    name: "",
    url: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    logo: "",
  });

  // Edit Company Form
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: "",
    url: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    logo: "",
  });

  // Separate subcategories for edit form
  const [editSubcategories, setEditSubcategories] = useState([]);

  // Logo upload states
  const [logoUploading, setLogoUploading] = useState(false);
  const [editLogoUploading, setEditLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [editLogoPreview, setEditLogoPreview] = useState("");

  const logoInputRef = useRef(null);
  const editLogoInputRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch only categories on mount (not companies)
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch claims when claims tab is active
  useEffect(() => {
    if (activeTab === "claims") {
      fetchPendingClaims();
    }
  }, [activeTab]);

  const fetchCategories = () => {
    fetch(`${API_BASE_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  };

  const fetchPendingClaims = async () => {
    setClaimsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/company-claims/pending`, {
        headers: getAuthHeaders(),
      });
      setPendingClaims(res.data.claims || []);
    } catch (err) {
      console.error("Error fetching claims:", err);
    } finally {
      setClaimsLoading(false);
    }
  };

  const handleApproveClaim = async (claimId) => {
    setClaimActionLoading(claimId);
    try {
      await axios.put(
        `${API_BASE_URL}/company-claims/${claimId}/approve`,
        {},
        { headers: getAuthHeaders() }
      );
      setPendingClaims((prev) => prev.filter((c) => c._id !== claimId));
    } catch (err) {
      console.error("Error approving claim:", err);
      showToast("Failed to approve claim", "error");
    } finally {
      setClaimActionLoading(null);
    }
  };

  const handleRejectClaim = async (claimId) => {
    const notes = prompt("Rejection reason (optional):");
    setClaimActionLoading(claimId);
    try {
      await axios.put(
        `${API_BASE_URL}/company-claims/${claimId}/reject`,
        { adminNotes: notes || "" },
        { headers: getAuthHeaders() }
      );
      setPendingClaims((prev) => prev.filter((c) => c._id !== claimId));
    } catch (err) {
      console.error("Error rejecting claim:", err);
      showToast("Failed to reject claim", "error");
    } finally {
      setClaimActionLoading(null);
    }
  };

  // Modified to fetch companies based on category/subcategory selection
  const fetchCompaniesForCategory = (categoryId, subcategoryId = "") => {
    let url = `${API_BASE_URL}/companies?categoryId=${categoryId}`;
    if (subcategoryId) {
      url += `&subcategoryId=${subcategoryId}`;
    }
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch((err) => console.error(err));
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle category selection for viewing companies
  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryForCompanies(categoryId);
    setSelectedSubcategoryForCompanies("");
    fetchCompaniesForCategory(categoryId);
  };

  // Handle subcategory selection for viewing companies
  const handleSubcategorySelect = (categoryId, subcategoryId) => {
    setSelectedCategoryForCompanies(categoryId);
    setSelectedSubcategoryForCompanies(subcategoryId);
    fetchCompaniesForCategory(categoryId, subcategoryId);
  };

  // Fetch subcategories when category selected for company
  useEffect(() => {
    if (companyForm.categoryId) {
      fetch(
        `${API_BASE_URL}/subcategories?categoryId=${companyForm.categoryId}`
      )
        .then((res) => res.json())
        .then((data) => setSubcategories(data))
        .catch((err) => console.error(err));
    } else {
      setSubcategories([]);
    }
  }, [companyForm.categoryId]);

  // Fetch subcategories for edit form
  useEffect(() => {
    if (editCompanyForm.categoryId) {
      fetch(
        `${API_BASE_URL}/subcategories?categoryId=${editCompanyForm.categoryId}`
      )
        .then((res) => res.json())
        .then((data) => {
          setEditSubcategories(data);
          const validSubcategoryIds = data.map(sub => sub._id);
          if (!validSubcategoryIds.includes(editCompanyForm.subcategoryId)) {
            setEditCompanyForm(prev => ({ ...prev, subcategoryId: "" }));
          }
        })
        .catch((err) => console.error(err));
    } else {
      setEditSubcategories([]);
    }
  }, [editCompanyForm.categoryId, editCompanyForm.subcategoryId]);

  // Handle inputs
  const handleChange = (formSetter) => (e) => {
    formSetter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Logo upload (new company)
  const handleLogoUpload = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const res = await axios.post(`${API_BASE_URL}/upload/company-logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = res.data.imageUrl;
      setCompanyForm((prev) => ({ ...prev, logo: imageUrl }));
      setLogoPreview(imageUrl);
      showToast("Logo uploaded successfully!", "success");
    } catch (err) {
      console.error("Error uploading logo:", err);
      showToast("Failed to upload logo", "error");
    } finally {
      setLogoUploading(false);
    }
  };

  // Logo upload (edit company)
  const handleEditLogoUpload = async (file) => {
    if (!file) return;
    setEditLogoUploading(true);
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const res = await axios.post(`${API_BASE_URL}/upload/company-logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = res.data.imageUrl;
      setEditCompanyForm((prev) => ({ ...prev, logo: imageUrl }));
      setEditLogoPreview(imageUrl);
      showToast("Logo uploaded successfully!", "success");
    } catch (err) {
      console.error("Error uploading logo:", err);
      showToast("Failed to upload logo", "error");
    } finally {
      setEditLogoUploading(false);
    }
  };

  // Create Category
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });
      if (!res.ok) throw new Error("Failed to add category");
      await fetchCategories();
      setCategoryForm({ name: "" });
    } catch (err) {
      console.error(err);
      showToast("Failed to add category", "error");
    }
  };

  // Create Subcategory
  const handleAddSubcategory = async () => {
    if (!subcategoryForm.name.trim() || !subcategoryForm.categoryId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subcategoryForm),
      });
      if (!res.ok) throw new Error("Failed to add subcategory");
      setSubcategoryForm({ name: "", categoryId: "" });
      fetchCategories();
    } catch (err) {
      console.error(err);
      showToast("Failed to add subcategory", "error");
    }
  };

  // Create Company
  const handleAddCompany = async () => {
    if (!companyForm.name.trim() || !companyForm.categoryId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(companyForm),
      });
      if (!res.ok) throw new Error("Failed to add company");
      if (selectedCategoryForCompanies === companyForm.categoryId) {
        if (!selectedSubcategoryForCompanies || selectedSubcategoryForCompanies === companyForm.subcategoryId) {
          fetchCompaniesForCategory(selectedCategoryForCompanies, selectedSubcategoryForCompanies);
        }
      }
      setCompanyForm({
        name: "",
        url: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        logo: "",
      });
      setLogoPreview("");
      setSubcategories([]);
    } catch (err) {
      console.error(err);
      showToast("Failed to add company", "error");
    }
  };

  // Edit Company
  const handleEditCompany = (company) => {
    setEditingCompany(company._id);
    setEditCompanyForm({
      name: company.name,
      url: company.url,
      description: company.description,
      categoryId: company.category?._id || "",
      subcategoryId: company.subcategory?._id || "",
      logo: company.logo,
    });
    setEditLogoPreview(company.logo);
  };

  const handleUpdateCompany = async () => {
    if (!editCompanyForm.name.trim() || !editCompanyForm.categoryId) {
      showToast("Please fill in required fields", "warning");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/companies/${editingCompany}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCompanyForm),
      });
      if (!res.ok) throw new Error("Failed to update company");
      if (selectedCategoryForCompanies) {
        fetchCompaniesForCategory(selectedCategoryForCompanies, selectedSubcategoryForCompanies);
      }
      setEditingCompany(null);
      setEditSubcategories([]);
      setEditCompanyForm({
        name: "",
        url: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        logo: "",
      });
      setEditLogoPreview("");
      showToast("Company updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update company", "error");
    }
  };

  const cancelEdit = () => {
    setEditingCompany(null);
    setEditSubcategories([]);
    setEditCompanyForm({
      name: "",
      url: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      logo: "",
    });
    setEditLogoPreview("");
  };

  // Delete with confirmation
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${type}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed to delete ${type.slice(0, -1)}`);
      if (type === "categories" || type === "subcategories") fetchCategories();
      if (type === "companies" && selectedCategoryForCompanies) {
        fetchCompaniesForCategory(selectedCategoryForCompanies, selectedSubcategoryForCompanies);
      }
    } catch (err) {
      console.error(err);
      showToast(`Failed to delete ${type.slice(0, -1)}`, "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-brand-500 via-brand-400 to-coral-500 text-transparent bg-clip-text">
              Admin Panel
            </span>
          </h1>
          <p className="text-slate-600 text-lg">Manage your categories, subcategories, companies, and company claims</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-1 inline-flex">
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === "manage"
                  ? "bg-brand-500 text-white shadow-md"
                  : "text-slate-600 hover:text-brand-600 hover:bg-slate-50"
              }`}
            >
              <i className="bx bx-cog mr-2"></i>Manage Content
            </button>
            <button
              onClick={() => setActiveTab("claims")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 relative ${
                activeTab === "claims"
                  ? "bg-brand-500 text-white shadow-md"
                  : "text-slate-600 hover:text-brand-600 hover:bg-slate-50"
              }`}
            >
              <i className="bx bx-badge-check mr-2"></i>Company Claims
              {pendingClaims.length > 0 && activeTab !== "claims" && (
                <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {pendingClaims.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* CLAIMS TAB */}
        {activeTab === "claims" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mr-4">
                    <i className="bx bx-badge-check text-2xl text-brand-500"></i>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">Pending Claims</h2>
                    <p className="text-slate-500 text-sm">Review and approve company ownership requests</p>
                  </div>
                </div>
                <button
                  onClick={fetchPendingClaims}
                  className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200"
                >
                  <i className="bx bx-refresh mr-1"></i> Refresh
                </button>
              </div>

              {claimsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
                </div>
              ) : pendingClaims.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="bx bx-check-circle text-green-500 text-3xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">All Caught Up!</h3>
                  <p className="text-slate-500">No pending company claims to review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingClaims.map((claim) => (
                    <div
                      key={claim._id}
                      className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-brand-200 transition-colors duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Company Info */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <img
                            src={claim.company?.logo || "https://via.placeholder.com/48?text=Co"}
                            alt={claim.company?.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/48?text=Co"; }}
                          />
                          <div>
                            <h3 className="font-bold text-slate-800">{claim.company?.name || "Unknown"}</h3>
                            <p className="text-xs text-slate-500">{claim.company?.category?.name || "General"}</p>
                          </div>
                        </div>

                        {/* Claim Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              <i className="bx bx-user mr-1"></i> {claim.user?.name || "Unknown User"}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                              <i className="bx bx-briefcase mr-1"></i> {claim.role}
                            </span>
                            {claim.jobTitle && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                {claim.jobTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mb-2">
                            {claim.user?.email || "No email"}
                          </p>
                          {claim.reason && (
                            <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                              <span className="font-medium text-slate-700">Reason: </span>
                              {claim.reason}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            Submitted {new Date(claim.createdAt).toLocaleDateString("en-US", {
                              year: "numeric", month: "short", day: "numeric"
                            })}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApproveClaim(claim._id)}
                            disabled={claimActionLoading === claim._id}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 text-sm"
                          >
                            {claimActionLoading === claim._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <><i className="bx bx-check mr-1"></i> Approve</>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectClaim(claim._id)}
                            disabled={claimActionLoading === claim._id}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 text-sm"
                          >
                            {claimActionLoading === claim._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <><i className="bx bx-x mr-1"></i> Reject</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MANAGE CONTENT TAB */}
        {activeTab === "manage" && (
          <>
            {/* CATEGORY SECTION */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mr-4">
                  <i className="bx bx-folder text-2xl text-brand-500"></i>
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Categories</h2>
              </div>
              
              <div className="space-y-4 mb-8">
                <input
                  type="text"
                  name="name"
                  placeholder="Category Name"
                  value={categoryForm.name}
                  onChange={handleChange(setCategoryForm)}
                  className="w-full p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200 outline-none text-slate-800"
                />
                <button 
                  onClick={handleAddCategory}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-md"
                >
                  Add Category
                </button>
              </div>

              {/* Categories List */}
              <div className="space-y-4">
                {categories.map((cat) => (
                  <div key={cat._id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => toggleCategoryExpansion(cat._id)}
                          className="text-slate-600 hover:text-slate-800 transition-colors duration-200"
                        >
                          {expandedCategories.includes(cat._id) ? '▼' : '▶'}
                        </button>
                        <span className="font-bold text-lg text-slate-800 cursor-pointer" onClick={() => handleCategorySelect(cat._id)}>
                          {cat.name}
                        </span>
                        <button
                          onClick={() => handleCategorySelect(cat._id)}
                          className="text-sm text-brand-500 hover:text-brand-600 transition-colors duration-200"
                        >
                          View Companies
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete("categories", cat._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                    
                    {/* Subcategories - Only show when expanded */}
                    {expandedCategories.includes(cat._id) && cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="ml-4 space-y-2">
                        <p className="text-sm font-medium text-slate-600 mb-2">Subcategories:</p>
                        {cat.subcategories.map((sub) => (
                          <div key={sub._id} className="flex justify-between items-center bg-white p-3 rounded-md border border-slate-200">
                            <span className="text-slate-700 cursor-pointer" onClick={() => handleSubcategorySelect(cat._id, sub._id)}>
                              ↳ {sub.name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSubcategorySelect(cat._id, sub._id)}
                                className="text-sm text-brand-500 hover:text-brand-600 transition-colors duration-200"
                              >
                                View Companies
                              </button>
                              <button
                                onClick={() => handleDelete("subcategories", sub._id)}
                                className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition-all duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SUBCATEGORY SECTION */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mr-4">
                  <i className="bx bx-folder-open text-2xl text-brand-500"></i>
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Subcategories</h2>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Subcategory Name"
                  value={subcategoryForm.name}
                  onChange={handleChange(setSubcategoryForm)}
                  className="w-full p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200 outline-none text-slate-800"
                />
                <select
                  name="categoryId"
                  value={subcategoryForm.categoryId}
                  onChange={handleChange(setSubcategoryForm)}
                  className="w-full p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200 outline-none text-slate-800"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleAddSubcategory}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-md"
                >
                  Add Subcategory
                </button>
              </div>
            </div>

            {/* COMPANY SECTION */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-coral-50 rounded-full flex items-center justify-center mr-4">
                  <i className="bx bx-buildings text-2xl text-coral-500"></i>
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Companies</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Company Name"
                    value={companyForm.name}
                    onChange={handleChange(setCompanyForm)}
                    className="p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200 outline-none text-slate-800"
                  />
                  <input
                    type="url"
                    name="url"
                    placeholder="Company Website"
                    value={companyForm.url}
                    onChange={handleChange(setCompanyForm)}
                    className="p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200 outline-none text-slate-800"
                  />
                </div>
                
                <textarea
                  name="description"
                  placeholder="Company Description"
                  value={companyForm.description}
                  onChange={handleChange(setCompanyForm)}
                  rows="3"
                  className="w-full p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200 outline-none resize-none text-slate-800"
                />
                
                {/* Logo Upload */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700">Company Logo</label>
                  {logoPreview && (
                    <div className="flex justify-center">
                      <img src={logoPreview} alt="Logo Preview" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
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
                    className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center gap-2 text-slate-600 hover:border-brand-400 hover:text-brand-600"
                  >
                    {logoUploading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                        Uploading...
                      </>
                    ) : (
                      <><i className="bx bx-image-add text-xl"></i> {logoPreview ? "Change Logo" : "Upload Company Logo"}</>
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    name="categoryId"
                    value={companyForm.categoryId}
                    onChange={handleChange(setCompanyForm)}
                    className="p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200 outline-none text-slate-800"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    name="subcategoryId"
                    value={companyForm.subcategoryId}
                    onChange={handleChange(setCompanyForm)}
                    className="p-4 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200 outline-none text-slate-800"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={handleAddCompany}
                  className="w-full bg-coral-500 hover:bg-coral-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-md"
                >
                  Add Company
                </button>
              </div>
            </div>

            {/* COMPANIES LIST - Only shows when category/subcategory is selected */}
            {selectedCategoryForCompanies && (
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mr-4">
                    <i className="bx bx-list-ul text-2xl text-brand-500"></i>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">Companies List</h2>
                    <p className="text-slate-600">
                      Showing companies for: {categories.find(c => c._id === selectedCategoryForCompanies)?.name}
                      {selectedSubcategoryForCompanies && 
                        ` > ${categories.find(c => c._id === selectedCategoryForCompanies)?.subcategories?.find(s => s._id === selectedSubcategoryForCompanies)?.name}`
                      }
                    </p>
                  </div>
                </div>
                
                {companies.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-lg">No companies found for this selection.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((c) => (
                      <div key={c._id} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        {editingCompany === c._id ? (
                          /* Edit Form */
                          <div className="p-6">
                            <h3 className="text-lg font-bold mb-4 text-slate-800">Edit Company</h3>
                            <div className="space-y-3">
                              <input type="text" name="name" value={editCompanyForm.name} onChange={handleChange(setEditCompanyForm)} className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-slate-800" placeholder="Company Name" />
                              <input type="url" name="url" value={editCompanyForm.url} onChange={handleChange(setEditCompanyForm)} className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-slate-800" placeholder="Website URL" />
                              <textarea name="description" value={editCompanyForm.description} onChange={handleChange(setEditCompanyForm)} rows="2" className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none resize-none text-slate-800" placeholder="Description" />
                              {/* Logo Upload for Edit */}
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Company Logo</label>
                                {editLogoPreview && (
                                  <div className="flex justify-center">
                                    <img src={editLogoPreview} alt="Logo Preview" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
                                  </div>
                                )}
                                <input type="file" ref={editLogoInputRef} onChange={(e) => handleEditLogoUpload(e.target.files[0])} accept="image/*" className="hidden" />
                                <button type="button" onClick={() => editLogoInputRef.current?.click()} disabled={editLogoUploading} className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center gap-2 text-slate-600 hover:border-brand-400 hover:text-brand-600">
                                  {editLogoUploading ? (<><div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>Uploading...</>) : (<><i className="bx bx-image-add text-xl"></i> {editLogoPreview ? "Change Logo" : "Upload Company Logo"}</>)}
                                </button>
                              </div>
                              <select name="categoryId" value={editCompanyForm.categoryId} onChange={handleChange(setEditCompanyForm)} className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-slate-800">
                                <option value="">Select Category</option>
                                {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                              </select>
                              <select name="subcategoryId" value={editCompanyForm.subcategoryId} onChange={handleChange(setEditCompanyForm)} className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-slate-800">
                                <option value="">Select Subcategory</option>
                                {editSubcategories.map((sub) => (<option key={sub._id} value={sub._id}>{sub.name}</option>))}
                              </select>
                              <div className="flex space-x-2">
                                <button type="button" onClick={handleUpdateCompany} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-semibold">Save</button>
                                <button type="button" onClick={cancelEdit} className="flex-1 bg-slate-400 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-semibold">Cancel</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Display Mode */
                          <>
                            <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                              <img src={c.logo || "https://via.placeholder.com/150"} alt={c.name} className="h-20 w-20 object-contain rounded-lg shadow-md" onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }} />
                            </div>
                            <div className="p-6">
                              <h3 className="text-xl font-bold text-slate-800 mb-2">{c.name}</h3>
                              <p className="text-sm text-slate-600 mb-3 line-clamp-3">{c.description}</p>
                              {c.url && (
                                <a href={c.url} target="_blank" rel="noreferrer" className="text-brand-500 hover:text-brand-600 text-sm mb-3 block truncate transition-colors duration-200">
                                  <i className="bx bx-link-external mr-1"></i> {c.url}
                                </a>
                              )}
                              <div className="text-xs text-slate-500 mb-4 space-y-1">
                                <p><span className="font-medium">Category:</span> {c.category?.name || "N/A"}</p>
                                <p><span className="font-medium">Subcategory:</span> {c.subcategory?.name || "N/A"}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button onClick={() => handleEditCompany(c)} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm font-semibold">Edit</button>
                                <button onClick={() => handleDelete("companies", c._id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all duration-200 text-sm font-semibold">Delete</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
