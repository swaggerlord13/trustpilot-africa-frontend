import { API_BASE_URL } from "../config.js";
import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import Header from "../pages/Header";
import Footer from "../components/Footer.jsx";
import Loader from "../components/Loader.jsx";
import StarRating from "../components/StarRatings.jsx";

export default function BrowseCompanies() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State from URL params (so filters survive refresh / share)
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);

  // Data
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState({ cities: [], countries: [], countryToCities: {} });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Load categories and locations for filter dropdowns
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          axios.get(API_BASE_URL + "/categories"),
          axios.get(API_BASE_URL + "/companies/locations"),
        ]);
        setCategories(catRes.data || []);
        setLocations(locRes.data || { cities: [], countries: [] });
      } catch (err) {
        console.error("Error loading filters:", err);
      }
    };
    loadFilters();
  }, []);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (city) params.set("city", city);
      if (country) params.set("country", country);
      if (category) params.set("category", category);
      if (minRating) params.set("minRating", minRating);
      if (sort) params.set("sort", sort);
      params.set("page", currentPage);
      params.set("limit", "20");

      const res = await axios.get(API_BASE_URL + "/companies/search?" + params.toString());
      setCompanies(res.data.companies || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error("Error searching companies:", err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, city, country, category, minRating, sort, currentPage]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (city) params.set("city", city);
    if (country) params.set("country", country);
    if (category) params.set("category", category);
    if (minRating) params.set("minRating", minRating);
    if (sort !== "relevance") params.set("sort", sort);
    if (currentPage > 1) params.set("page", currentPage);
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, city, country, category, minRating, sort, currentPage, setSearchParams]);

  const clearFilters = () => {
    setQuery("");
    setCity("");
    setCountry("");
    setCategory("");
    setMinRating("");
    setSort("relevance");
    setCurrentPage(1);
  };

  const hasActiveFilters = city || country || category || minRating || sort !== "relevance";

  // Company logo helper
  const getCompanyLogo = (company) => {
    if (company.logo) return company.logo;
    if (company.url) {
      try {
        const cleaned = company.url.startsWith("http") ? company.url : "https://" + company.url;
        return "https://logo.clearbit.com/" + new URL(cleaned).hostname.replace(/^www\./, "");
      } catch (e) { /* ignore */ }
    }
    return null;
  };

  const activeFilterCount = [city, country, category, minRating].filter(Boolean).length;

  return (
    <>
      <Header />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "20px 20px" }}></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-14 md:py-20 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Find the Right Company
          </h1>
          <p className="text-brand-100 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Search by what you need &#8212; not just by name. Looking for the best place to buy furniture in Lagos? Just type it.
          </p>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            <i className="bx bx-search absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-slate-400"></i>
            <input
              type="text"
              placeholder='Try "furniture", "restaurant in Lagos", or a company name...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-14 md:h-16 rounded-2xl border-2 border-white/20 pl-14 pr-5 text-base md:text-lg focus:outline-none focus:border-white focus:ring-4 focus:ring-white/20 transition-all bg-white/95 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Mobile filter toggle ── */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200"
          >
            <i className="bx bx-filter-alt text-lg"></i>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-brand-500 text-white text-xs rounded-full">{activeFilterCount}</span>
            )}
          </button>

          {/* ── SIDEBAR FILTERS ── */}
          <aside className={"lg:w-72 flex-shrink-0 " + (showMobileFilters ? "block" : "hidden lg:block")}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sticky top-4 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                    Clear all
                  </button>
                )}
              </div>

              {/* Country */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Country</label>
                <select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setCity(""); setCurrentPage(1); }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All countries</option>
                  {locations.countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">City</label>
                <select
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All cities</option>
                  {(country && locations.countryToCities[country]
                    ? locations.countryToCities[country]
                    : locations.cities
                  ).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Minimum Rating</label>
                <div className="flex gap-2">
                  {[0, 2, 3, 4].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setMinRating(r === 0 ? "" : String(r)); setCurrentPage(1); }}
                      className={"flex-1 py-2 rounded-lg text-sm font-medium border transition-all " +
                        ((r === 0 && !minRating) || String(r) === minRating
                          ? "bg-brand-500 text-white border-brand-500"
                          : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-brand-300")}
                    >
                      {r === 0 ? "Any" : r + "+"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Sort by</label>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setCurrentPage(1); }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="newest">Newest</option>
                  <option value="name">A &#8211; Z</option>
                </select>
              </div>
            </div>
          </aside>

          {/* ── RESULTS ── */}
          <main className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {loading ? "Searching..." : (
                  pagination.total === 0
                    ? "No companies found"
                    : pagination.total + " " + (pagination.total === 1 ? "company" : "companies") + " found"
                )}
                {debouncedQuery && !loading && (
                  <span> for &quot;{debouncedQuery}&quot;</span>
                )}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader message="Searching companies..." />
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">&#128269;</div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  No companies found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  {debouncedQuery
                    ? 'We couldn\'t find any companies matching "' + debouncedQuery + '". Try different keywords or adjust your filters.'
                    : "Try searching for something or adjusting your filters."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-5 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Company cards grid */}
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {companies.map((company) => {
                    const logo = getCompanyLogo(company);
                    return (
                      <Link
                        key={company._id}
                        to={"/company/" + company.slug}
                        className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-brand-200 dark:hover:border-brand-500/40 transition-all"
                      >
                        {/* Top: logo + name */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {logo ? (
                              <img
                                src={logo}
                                alt={company.name}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.parentElement.innerHTML = '<i class="bx bx-building text-2xl text-slate-400"></i>';
                                }}
                              />
                            ) : (
                              <i className="bx bx-building text-2xl text-slate-400"></i>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-800 dark:text-white text-base group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                              {company.name}
                            </h3>
                            {company.categoryName && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">{company.categoryName}</span>
                            )}
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <StarRating rating={company.avgRating || 0} />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {company.avgRating ? company.avgRating.toFixed(1) : "0.0"}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({company.reviewCount || 0} {company.reviewCount === 1 ? "review" : "reviews"})
                          </span>
                        </div>

                        {/* Description */}
                        {company.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                            {company.description}
                          </p>
                        )}

                        {/* Location */}
                        {(company.city || company.country) && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <i className="bx bx-map"></i>
                            <span>
                              {[company.city, company.country].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <i className="bx bx-chevron-left text-lg"></i>
                    </button>

                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={"px-4 py-2.5 rounded-xl text-sm font-medium transition " +
                            (pageNum === currentPage
                              ? "bg-brand-500 text-white shadow-sm"
                              : "border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700")}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage >= pagination.totalPages}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <i className="bx bx-chevron-right text-lg"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
}
