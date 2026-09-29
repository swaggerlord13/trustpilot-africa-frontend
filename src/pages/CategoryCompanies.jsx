import api, { API_BASE_URL } from "../api.js";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate} from "react-router-dom";
import Header from "../pages/Header";
import Loader from "../components/Loader";
import StarRating from "../components/StarRatings";
import AddCompanyModal from "../components/AddCompanyModal";
import Footer from "../components/Footer.jsx";
import CompanyLogo from "../components/CompanyLogo";
import { useToast } from "../components/Toast.jsx";

const CategoryCompanies = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  // Data states
  const showToast = useToast();
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({});
  const [category, setCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // UI states
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);

  // Responsive items per page
  const [itemsPerPage, setItemsPerPage] = useState(30);

  // Debounced search function
  const debouncedFetchRef = useRef(null);

  const fetchCompanies = useCallback(async (searchValue = "", sortValue = "name", page = 1, showLoading = true) => {
    if (showLoading) setSearchLoading(true);
    
    try {
      const params = {
        page: page,
        limit: itemsPerPage,
        search: searchValue.trim(),
        sort: sortValue
      };

      const response = await api.get(
        `${API_BASE_URL}/categories/${slug}/companies-paginated`,
        { params }
      );

      setCompanies(response.data.companies || []);
      setPagination(response.data.pagination || {});
      setCategory(response.data.category || {});

    } catch (err) {
      console.error("Error fetching companies:", err);
      setCompanies([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [slug, itemsPerPage]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultCompanyName, setDefaultCompanyName] = useState("");

  // Handle search input change with debouncing
  const handleSearchChange = (value) => {
    setSearch(value);
    
    // Clear existing timeout
    if (debouncedFetchRef.current) {
      clearTimeout(debouncedFetchRef.current);
    }

    // Set new timeout
    debouncedFetchRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchCompanies(value, sort, 1, false); // Don't show main loading, only search loading
    }, 500); // debounce delay
  };

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(12); // Mobile: 12 companies per page
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(18); // Tablet: 18 companies per page
      } else {
        setItemsPerPage(30); // Desktop: 30 companies per page
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  // Fetch companies from backend with pagination
  useEffect(() => {
    const fetchInitialCompanies = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          search: search.trim(),
          sort
        };

        const response = await api.get(
          `${API_BASE_URL}/categories/${slug}/companies-paginated`,
          { params }
        );

        setCompanies(response.data.companies || []);
        setPagination(response.data.pagination || {});
        setCategory(response.data.category || {});

      } catch (err) {
        console.error("Error fetching companies:", err);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchInitialCompanies();
    }
  }, [slug, currentPage, itemsPerPage]); // sort and search handled by their own handlers to avoid double-fetch

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSort(newSort);
    setCurrentPage(1);
    fetchCompanies(search, newSort, 1, false);
  };

  // Handle add company
  const handleAddCompany = async ({ name, url, city, country }) => {
    const newCompany = { name, url: url || "", city: city || "", country: country || "" };
    
    try {
      const response = await api.post(`${API_BASE_URL}/companies`, newCompany);
      
      setIsModalOpen(false);
      navigate(`/company/${response.data.slug}?openReview=true`);
      
    } catch (err) {
      console.error("Error creating company:", err);
      if (err.response && err.response.status === 409) {
        // Let modal handle duplicate error display
        throw err;
      }
      showToast(`Error adding company: ${err.message}`, "error");
      throw err;
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader message="Loading companies..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-slate-600 dark:text-slate-300">
            <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/categories" className="hover:text-brand-500 transition-colors">Categories</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">{category.name}</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Companies in {category.name}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {pagination.totalCompanies || 0} companies found
            {search && ` for "${search}"`}
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="relative flex-1 max-w-lg w-full">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-3 focus:ring-brand-100 focus:border-brand-500 transition-all duration-200 text-slate-900 placeholder-slate-500"
                />
                <div className="absolute left-4 top-3.5 text-slate-400">
                  {searchLoading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                      fetchCompanies("", sort, 1, false);
                      if (searchInputRef.current) {
                        searchInputRef.current.focus();
                      }
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchLoading && (
                <p className="text-sm text-brand-500 mt-2 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSortChange('name')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  sort === 'name' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 border border-slate-200 dark:border-slate-600'
                }`}
              >
                Sort by Name
              </button>
              <button
                onClick={() => handleSortChange('rating')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  sort === 'rating' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 border border-slate-200 dark:border-slate-600'
                }`}
              >
                Sort by Rating
              </button>
            </div>
          </div>
        </div>

        {/* Companies Grid or Empty State */}
        {companies.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-brand-50 rounded-full flex items-center justify-center">
              <i className="bx bx-search-alt text-3xl text-brand-500"></i>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
              {search ? `No companies found for "${search}"` : 'No companies found'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {search 
                ? "Try adjusting your search terms or add a new company."
                : "Be the first to add a company in this category!"
              }
            </p>
            <button
              className="px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-semibold"
              onClick={() => {
                setDefaultCompanyName(search);
                setIsModalOpen(true);
              }}
            >
              + Add New Company
            </button>
          </div>
        ) : (
          <>
            {/* Companies Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {companies.map((company) => (
                <div
                  key={company._id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  {/* Company Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <CompanyLogo
                        logo={company.logo}
                        url={company.url}
                        name={company.name}
                        size={56}
                      />

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/company/${company.slug}`}
                          className="block group-hover:text-brand-500 transition-colors"
                        >
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg leading-tight mb-1 truncate">
                            {company.name}
                          </h3>
                        </Link>
                        
                        {/* Country Badge */}
                        {company.country && (
                          <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                            {company.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {company.description && (
                    <div className="px-6 pb-3">
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {company.description}
                      </p>
                    </div>
                  )}

                  {/* Rating Section */}
                  <div className="px-6 pb-4">
                    <div className="flex items-center justify-between">
                      {/* Rating */}
                      {company.avgRating > 0 ? (
                        <div className="flex items-center gap-2">
                          <StarRating rating={Math.round(company.avgRating)} />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {company.avgRating}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-slate-300">★</span>
                            ))}
                          </div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">No ratings</span>
                        </div>
                      )}

                      {/* Review Count */}
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {company.reviewCount || 0} reviews
                      </span>
                    </div>
                  </div>

                  {/* Website Link */}
                  {company.url && (
                    <div className="px-6 pb-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <a
                        href={company.url.startsWith('http') ? company.url : `https://${company.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-500 hover:text-brand-600 truncate block pt-3"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => {
                    const newPage = Math.max(currentPage - 1, 1);
                    setCurrentPage(newPage);
                  }}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-brand-500 text-white'
                            : 'bg-white border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    const newPage = Math.min(currentPage + 1, pagination.totalPages);
                    setCurrentPage(newPage);
                  }}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Pagination Info */}
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Showing {companies.length} of {pagination.totalCompanies} companies
              {pagination.totalPages > 1 && (
                <> • Page {currentPage} of {pagination.totalPages}</>
              )}
            </div>
          </>
        )}

        {/* Add Company Modal */}
        <AddCompanyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddCompany={handleAddCompany}
          defaultName={defaultCompanyName}
        />
        </div>
      </div>
          <Footer />
    </>
  );
};

export default CategoryCompanies;
