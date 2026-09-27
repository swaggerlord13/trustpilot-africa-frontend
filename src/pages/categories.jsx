import { API_BASE_URL } from "../config.js";
import { useState, useEffect } from "react";
import "../styles/categories.css";
import Header from "../pages/Header.jsx";
import { Link } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import Footer from "../components/Footer.jsx";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then((response) => response.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        setLoading(false);
      });
  }, []);

  // 🔎 Filter categories & subcategories
  const filteredCategories = categories
    .map((cat) => {
      const matchesCategory = cat.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchingSubs = cat.subcategories?.filter((sub) =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (matchesCategory) {
        return { ...cat, subcategories: cat.subcategories };
      } else if (matchingSubs && matchingSubs.length > 0) {
        return { ...cat, subcategories: matchingSubs };
      }
      return null;
    })
    .filter(Boolean);

  const toggleCategory = (id) => {
    setExpandedCategory((prev) => (prev === id ? null : id));
  };

  const handleCategoryClick = (e, categoryId) => {
    // On mobile, prevent navigation and toggle dropdown
    if (window.innerWidth <= 768) {
      e.preventDefault();
      toggleCategory(categoryId);
    }
    // On desktop/tablet, allow normal navigation
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-64">
          <Loader message="Loading Categories..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="categorieshead">
        <h1>What are you looking for?</h1>
        <input
          type="text"
          placeholder="Search categories or subcategories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <p className="Explore">Explore companies by category</p>

      <div className="category-container">
        <div className="categories-grid">
          {filteredCategories.length === 0 ? (
            <p className="no-results">No categories found.</p>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat._id} className="category-card">
                {/* Category Header */}
                <div 
                  className="categoryhead flex justify-between items-center"
                  onClick={(e) => handleCategoryClick(e, cat._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleCategoryClick(e, cat._id);
                    }
                  }}
                >
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="category-link"
                    onClick={(e) => {
                      // Prevent navigation on mobile when clicking the header
                      if (window.innerWidth <= 768) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {cat.name}
                  </Link>

                  {/* Toggle button - visible on mobile only */}
                  <button
                    className={`md:hidden toggle-btn ${
                      expandedCategory === cat._id ? 'expanded' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(cat._id);
                    }}
                    aria-label={
                      expandedCategory === cat._id 
                        ? `Collapse ${cat.name} subcategories`
                        : `Expand ${cat.name} subcategories`
                    }
                  >
                    {expandedCategory === cat._id ? "−" : "+"}
                  </button>
                </div>

                {/* Subcategories */}
                <div
                  className={`categorysub 
                    ${expandedCategory === cat._id ? "block" : "hidden"} 
                    md:block`} // Always visible on desktop/tablet
                >
                  {cat.subcategories?.length > 0 && (
                    <ul className="subcategory-list">
                      {cat.subcategories.map((sub) => (
                        <li key={sub._id} className="subcategory-item">
                          <Link
                            to={`/categories/${cat.slug}/${sub.slug}`}
                            className="subcategory-link"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
          <Footer />
    </>
  );
}