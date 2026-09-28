import { API_BASE_URL } from "../config.js";
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../pages/Header";
import Loader from "../components/Loader";
import StarRating from "../components/StarRatings";
import AddCompanyModal from "../components/AddCompanyModal";
import Footer from "../components/Footer.jsx";
import CompanyLogo from "../components/CompanyLogo";
import { useToast } from "../components/Toast.jsx";

const Subcategory = () => {
  const navigate = useNavigate();
  const { slug, subSlug } = useParams();
  const showToast = useToast();
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultCompanyName, setDefaultCompanyName] = useState("");

  // Fetch real-time review data for each company
  const fetchCompanyReviews = async (companyId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/company/${companyId}`);
      if (response.ok) {
        const reviews = await response.json();
        const avgRating = reviews.length > 0 
          ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length)
          : 0;
        return {
          reviews: reviews,
          avgRating: avgRating,
          reviewCount: reviews.length
        };
      }
    } catch (error) {
      console.error("Error fetching reviews for company:", companyId, error);
    }
    return { reviews: [], avgRating: 0, reviewCount: 0 };
  };

  useEffect(() => {
    const fetchCompaniesWithReviews = async () => {
      const url = subSlug
        ? `${API_BASE_URL}/subcategories/${slug}/${subSlug}`
        : `${API_BASE_URL}/categories/${slug}/companies`;

      setLoading(true);
      try {
        // Fetch companies
        const response = await fetch(url);
        const companiesData = await response.json();
        const companiesArray = Array.isArray(companiesData) ? companiesData : [];

        setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1));
        if (subSlug)
          setSubCategoryName(subSlug.charAt(0).toUpperCase() + subSlug.slice(1));

        // Fetch reviews for each company to get accurate ratings
        const companiesWithReviews = await Promise.all(
          companiesArray.map(async (company) => {
            const reviewData = await fetchCompanyReviews(company._id);
            return {
              ...company,
              avgRating: reviewData.avgRating,
              reviews: reviewData.reviews,
              reviewCount: reviewData.reviewCount
            };
          })
        );

        setCompanies(companiesWithReviews);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching companies:", err);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCompaniesWithReviews();
    }
  }, [slug, subSlug]);

  if (loading) return <Loader message="Loading companies..." />;

  const bestInName = subSlug ? subCategoryName : categoryName;

  // Filter + sort
  let filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (sort === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "rating") {
    filtered.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Add company handler
  const handleAddCompany = async ({ name, url, city, country }) => {
    const newCompany = { 
      name, 
      url: url || "",
      city: city || "",
      country: country || "",
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompany),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const err = new Error(errorData.message || "Failed to create company");
        err.response = { status: response.status, data: errorData };
        throw err;
      }
      
      const savedCompany = await response.json();
      
      // Add the new company with empty reviews
      const newCompanyWithReviews = {
        ...savedCompany,
        avgRating: 0,
        reviews: [],
        reviewCount: 0
      };
      
      setCompanies(prev => [newCompanyWithReviews, ...prev]);
      setIsModalOpen(false);
      
      navigate(`/company/${savedCompany.slug}?openReview=true`);
      
    } catch (err) {
      console.error("Error creating company:", err);
      showToast(`Error adding company: ${err.message}`, "error");
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          <Link to={`/categories/${slug}`} className="text-brand-500 hover:underline">
            {categoryName}
          </Link>
          {subSlug && <span className="mx-2"> / </span>}
          {subSlug && (
            <span className="text-slate-700 dark:text-slate-200 font-medium">{subCategoryName}</span>
          )}
        </p>

        <h2 className="text-2xl font-bold text-brand-500 mb-6">
          BEST IN {bestInName.toUpperCase()}
        </h2>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 w-full sm:w-64 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
          >
            <option value="name">Sort by Name</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>

        {/* Company list or add button */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-slate-500 dark:text-slate-400 italic">No companies found.</p>
            <button
              className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600"
              onClick={() => {
                setDefaultCompanyName(search);
                setIsModalOpen(true);
              }}
            >
              + Add New Company
            </button>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((company) => (
              <li
                key={company._id}
                className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 rounded-xl p-4 hover:shadow-lg transition duration-200"
              >
                <div className="flex items-center gap-4 mb-3">
                  <CompanyLogo
                    logo={company.logo}
                    url={company.url}
                    name={company.name}
                    size={56}
                  />
                  <div>
                    <Link
                      to={`/company/${company.slug}`}
                      className="text-lg font-semibold text-brand-500 hover:underline"
                    >
                      {company.name}
                    </Link>
                    {company.url && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        <a
                          href={company.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-brand-500"
                        >
                          {company.url}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                {/* Country */}
                {company.country && (
                  <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full mb-2">
                    {company.country}
                  </span>
                )}
                {/* Description */}
                {company.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3" style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {company.description}
                  </p>
                )}
                {/* Reviews & Rating - Now using real-time data */}
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300 mt-2">
                  <span>
                    {company.reviewCount || 0}{" "}
                    {company.reviewCount === 1 ? "review" : "reviews"}
                  </span>
                  {company.avgRating > 0 ? (
                    <div className="flex items-center gap-1">
                      <StarRating rating={Math.round(company.avgRating)} />
                      <span className="text-sm text-slate-600 dark:text-slate-300 ml-1">
                        ({company.avgRating.toFixed(1)})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-lg text-slate-300">
                          ★
                        </span>
                      ))}
                      <span className="text-sm text-slate-600 dark:text-slate-300 ml-1">
                        (No ratings)
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Add company modal */}
        <AddCompanyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddCompany={handleAddCompany}
          defaultName={defaultCompanyName}
        />
      </div>
          <Footer />
    </>
  );
};

export default Subcategory;
