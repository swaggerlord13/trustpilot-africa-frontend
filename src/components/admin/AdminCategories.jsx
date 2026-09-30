import { useState, useEffect, useCallback } from "react";
import api from "../../api.js";
import { adminApi } from "./adminHelpers.jsx";
import { useToast } from "../Toast.jsx";

export default function AdminCategories() {
  const showToast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryParent, setNewSubcategoryParent] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi("/admin/categories");
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const saveCategory = async (id) => {
    try {
      await adminApi(`/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editCategoryName }),
      });
      showToast("Category renamed", "success");
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const saveSubcategory = async (id) => {
    try {
      await adminApi(`/admin/subcategories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editSubcategoryName }),
      });
      showToast("Subcategory renamed", "success");
      setEditingSubcategory(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.post("/categories", { name: newCategoryName.trim() });
      showToast("Category added", "success");
      setNewCategoryName("");
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, "error");
    }
  };

  const addSubcategory = async () => {
    if (!newSubcategoryName.trim() || !newSubcategoryParent) return;
    try {
      await api.post("/subcategories", { name: newSubcategoryName.trim(), categoryId: newSubcategoryParent });
      showToast("Subcategory added", "success");
      setNewSubcategoryName("");
      setNewSubcategoryParent("");
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category, all its subcategories, and all companies under them?")) return;
    try {
      await api.delete(`/categories/${id}`);
      showToast("Category deleted", "success");
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteSubcategory = async (id) => {
    if (!window.confirm("Delete this subcategory and all companies in it?")) return;
    try {
      await api.delete(`/subcategories/${id}`);
      showToast("Subcategory deleted", "success");
      fetchCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="admin-section">
      {/* Add new */}
      <div className="admin-cat-forms">
        <div className="admin-cat-form-card">
          <h4>Add Category</h4>
          <div className="admin-cat-form-row">
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button className="admin-btn-primary" onClick={addCategory}>Add</button>
          </div>
        </div>
        <div className="admin-cat-form-card">
          <h4>Add Subcategory</h4>
          <div className="admin-cat-form-row">
            <select value={newSubcategoryParent} onChange={(e) => setNewSubcategoryParent(e.target.value)}>
              <option value="">Parent category...</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Subcategory name"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
            />
            <button className="admin-btn-primary" onClick={addSubcategory}>Add</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner"></div></div>
      ) : (
        <div className="admin-categories-list">
          {categories.map((cat) => (
            <div key={cat._id} className="admin-cat-card">
              <div className="admin-cat-header">
                {editingCategory === cat._id ? (
                  <div className="admin-cat-edit-row">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      autoFocus
                    />
                    <button className="admin-btn-primary admin-btn-sm" onClick={() => saveCategory(cat._id)}>Save</button>
                    <button className="admin-btn-secondary admin-btn-sm" onClick={() => setEditingCategory(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="admin-cat-name-group">
                      <h3>{cat.name}</h3>
                      <span className="admin-cat-count">{cat.companyCount} companies</span>
                    </div>
                    <div className="admin-cat-actions">
                      <button className="admin-action-btn" title="Rename" onClick={() => { setEditingCategory(cat._id); setEditCategoryName(cat.name); }}>
                        <i className="bx bx-edit"></i>
                      </button>
                      <button className="admin-action-btn admin-delete-btn" title="Delete" onClick={() => deleteCategory(cat._id)}>
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {cat.subcategories && cat.subcategories.length > 0 && (
                <div className="admin-subcats">
                  {cat.subcategories.map((sub) => (
                    <div key={sub._id} className="admin-subcat-row">
                      {editingSubcategory === sub._id ? (
                        <div className="admin-cat-edit-row">
                          <input
                            type="text"
                            value={editSubcategoryName}
                            onChange={(e) => setEditSubcategoryName(e.target.value)}
                            autoFocus
                          />
                          <button className="admin-btn-primary admin-btn-sm" onClick={() => saveSubcategory(sub._id)}>Save</button>
                          <button className="admin-btn-secondary admin-btn-sm" onClick={() => setEditingSubcategory(null)}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <span className="admin-subcat-name">{sub.name}</span>
                          <div className="admin-cat-actions">
                            <button className="admin-action-btn" title="Rename" onClick={() => { setEditingSubcategory(sub._id); setEditSubcategoryName(sub.name); }}>
                              <i className="bx bx-edit"></i>
                            </button>
                            <button className="admin-action-btn admin-delete-btn" title="Delete" onClick={() => deleteSubcategory(sub._id)}>
                              <i className="bx bx-trash"></i>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
