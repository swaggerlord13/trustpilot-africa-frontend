import api from "../api.js";
import { useEffect, useRef, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import StarRating from "../components/StarRatings";
import Loader from "../components/Loader";
import Header from "../pages/Header";
import Footer from "../components/Footer.jsx";
import CompanyLogo from "../components/CompanyLogo";
// Reviews of the brand as a whole, with write/edit/delete
import BrandReviews from "../components/brand/BrandReviews.jsx";

// Locations loaded per page / "Load more" click
const PAGE_SIZE = 20;

// Text colour for a rating, same thresholds as the company page
function ratingColor(rating) {
  // Below 2.5 rounds to 1 or 2 stars: red
  if (rating < 2.5) return "text-red-500";
  // 2.5 to 3.4 rounds to 3 stars: amber
  if (rating < 3.5) return "text-yellow-500";
  // 3.5 and up: green
  return "text-green-500";
}

// "Ikeja, Lagos" style line for one location
function placeLine(loc) {
  // Skip empty parts so there are no stray commas
  return [loc.city, loc.state, loc.country].filter(Boolean).join(", ");
}

/**
 * Public brand page, e.g. /brand/mtn: the brand's overall rating across all
 * its locations, a 5..1 star breakdown, and the list of locations with
 * state and city filters. Filters live in the URL so a filtered view can be
 * shared, e.g. /brand/mtn?state=Lagos&city=Ikeja.
 */
export default function BrandPage() {
  // Brand slug from the URL
  const { slug } = useParams();
  // ?state=...&city=... filters
  const [searchParams, setSearchParams] = useSearchParams();
  // Selected state ("" = all states)
  const state = searchParams.get("state") || "";
  // Selected city ("" = all cities)
  const city = searchParams.get("city") || "";

  // Brand header data: { brand, avgRating, reviewCount, ratingBreakdown, locationCount, states }
  const [summary, setSummary] = useState(null);
  // "loading" | "ready" | "notfound" | "error" for the header data
  const [status, setStatus] = useState("loading");
  // Locations shown in the list
  const [locations, setLocations] = useState([]);
  // Paging info from the server for the list
  const [pagination, setPagination] = useState(null);
  // True while the list (first page) is loading
  const [loadingList, setLoadingList] = useState(true);
  // True while "Load more" is loading
  const [loadingMore, setLoadingMore] = useState(false);
  // Error message for the list, if it failed
  const [listError, setListError] = useState("");
  // Error from "Load more" only; the locations already shown stay visible
  const [moreError, setMoreError] = useState("");
  // Current brand + filters; lets "Load more" drop an answer for old filters
  const listKey = useRef("");
  // Brand currently shown, so a late header refresh for another brand is ignored
  const slugRef = useRef(slug);
  slugRef.current = slug;
  // Number of the newest header refresh; an older one that answers late is ignored
  const summaryGen = useRef(0);

  // Re-read the header numbers quietly (no loading screen), e.g. after the
  // user posts a brand review, so the overall rating updates
  const refreshSummary = () => {
    // Brand and number of this refresh
    const forSlug = slug;
    const gen = ++summaryGen.current;
    api
      .get(`/brands/${encodeURIComponent(forSlug)}`)
      // Apply only the newest refresh, and only if still on the same brand
      .then((res) => {
        if (slugRef.current === forSlug && gen === summaryGen.current) setSummary(res.data);
      })
      // Keep the numbers already shown if this fails
      .catch(() => {});
  };

  // Load the brand header whenever the slug changes
  useEffect(() => {
    // Ignore a late answer if the user has already moved to another brand
    let ignore = false;
    setStatus("loading");
    api
      .get(`/brands/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (ignore) return;
        setSummary(res.data);
        setStatus("ready");
      })
      .catch((err) => {
        if (ignore) return;
        // 404 means the brand doesn't exist; anything else is a real error
        setStatus(err.response?.status === 404 ? "notfound" : "error");
      });
    // Mark this request stale when the slug changes or the page closes
    return () => {
      ignore = true;
    };
  }, [slug]);

  // Load the first page of locations whenever the brand or filters change
  useEffect(() => {
    // Ignore a late answer if the filters changed again meanwhile
    let ignore = false;
    // Remember which list is showing now
    listKey.current = `${slug}|${state}|${city}`;
    setLoadingList(true);
    setListError("");
    setMoreError("");
    // Only send filters that are set
    const params = new URLSearchParams({ page: "1", limit: String(PAGE_SIZE) });
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    api
      .get(`/brands/${encodeURIComponent(slug)}/locations?${params}`)
      .then((res) => {
        if (ignore) return;
        setLocations(res.data.locations || []);
        setPagination(res.data.pagination || null);
      })
      .catch((err) => {
        if (ignore) return;
        setLocations([]);
        setPagination(null);
        setListError(err.response?.data?.error || "Could not load locations");
      })
      .finally(() => {
        if (!ignore) setLoadingList(false);
      });
    // Mark this request stale on the next change
    return () => {
      ignore = true;
    };
  }, [slug, state, city]);

  // Page title for the browser tab and search engines
  useEffect(() => {
    if (summary?.brand?.name) document.title = `${summary.brand.name} reviews | Trustpilotafrica`;
  }, [summary]);

  // Append the next page of locations
  const loadMore = async () => {
    // Nothing more to load
    if (!pagination?.hasNextPage) return;
    setLoadingMore(true);
    setMoreError("");
    // Which list this page belongs to
    const key = listKey.current;
    try {
      // Same filters, next page
      const params = new URLSearchParams({ page: String(pagination.page + 1), limit: String(PAGE_SIZE) });
      if (state) params.set("state", state);
      if (city) params.set("city", city);
      const res = await api.get(`/brands/${encodeURIComponent(slug)}/locations?${params}`);
      // Filters changed while loading: this page belongs to the old list
      if (key !== listKey.current) return;
      // Add to the end of the list
      setLocations((prev) => [...prev, ...(res.data.locations || [])]);
      setPagination(res.data.pagination || null);
    } catch (err) {
      // Ignore a failure that belongs to an old filter
      if (key !== listKey.current) return;
      // Keep the list; show the problem under it
      setMoreError(err.response?.data?.error || "Could not load more locations");
    } finally {
      setLoadingMore(false);
    }
  };

  // Change the state filter; the city resets because it belongs to a state
  const changeState = (value) => {
    // Keep only the filters that are set
    setSearchParams(value ? { state: value } : {}, { replace: true });
  };

  // Change the city filter within the selected state
  const changeCity = (value) => {
    // City only makes sense with a state, which is always set when cities show
    setSearchParams(value ? { state, city: value } : { state }, { replace: true });
  };

  // Header still loading
  if (status === "loading") {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader message="Loading brand..." />
        </div>
      </>
    );
  }

  // Unknown brand, or the server failed
  if (status !== "ready") {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto p-6 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bx bx-store text-slate-400 text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            {status === "notfound" ? "Brand not found" : "Something went wrong"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {status === "notfound"
              ? "The brand you're looking for doesn't exist or may have been removed."
              : "We couldn't load this brand. Please try again in a moment."}
          </p>
          <Link to="/companies" className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200 font-semibold">
            <i className="bx bx-search mr-1"></i> Browse companies
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  // Header data
  const { brand, avgRating, reviewCount, ratingBreakdown, locationCount, states, brandReviewCount = 0 } = summary;
  // Cities of the selected state, for the city filter
  const cities = states.find((s) => s.state === state)?.cities || [];
  // Website as a full link (older data may lack the https:// part)
  const websiteHref = brand.website && (brand.website.startsWith("http") ? brand.website : `https://${brand.website}`);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/companies" className="hover:text-brand-500 transition-colors">Companies</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">{brand.name}</span>
          </nav>

          {/* Brand header: logo, name, details, overall rating */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8 border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <CompanyLogo logo={brand.logo} url={brand.website} name={brand.name} size={120} />

              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">{brand.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Category, linking to its page */}
                  {brand.category && (
                    <Link
                      to={`/categories/${brand.category.slug}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300"
                    >
                      <i className="bx bx-category mr-1"></i> {brand.category.name}
                    </Link>
                  )}
                  {/* How many locations */}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <i className="bx bx-map-pin mr-1"></i> {locationCount} location{locationCount !== 1 ? "s" : ""}
                  </span>
                </div>
                {brand.description && (
                  <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{brand.description}</p>
                )}
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200 font-semibold"
                  >
                    <i className="bx bx-globe mr-2"></i> Visit Website
                  </a>
                )}
              </div>

              {/* Overall rating across every location */}
              <div className="text-center md:text-right">
                <div className={`text-4xl font-bold mb-1 ${reviewCount ? ratingColor(avgRating) : "text-slate-400"}`}>
                  {reviewCount ? avgRating.toFixed(1) : "-"}
                </div>
                <div className="mb-2 flex justify-center md:justify-end">
                  <StarRating rating={reviewCount ? Math.round(avgRating) : 0} />
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                  {/* Say how many are about the brand itself, when there are any */}
                  {brandReviewCount > 0 ? ` (${brandReviewCount} of the brand, ${reviewCount - brandReviewCount} of locations)` : " across all locations"}
                </div>
              </div>
            </div>

            {/* 5..1 star breakdown bars */}
            {reviewCount > 0 && (
              <div className="mt-6 space-y-1 max-w-md">
                {[5, 4, 3, 2, 1].map((stars) => {
                  // Number of reviews with this many stars
                  const count = ratingBreakdown?.[stars] || 0;
                  // Width of the bar as a percentage of all reviews
                  const pct = Math.round((count / reviewCount) * 100);
                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <span className="w-12 text-slate-600 dark:text-slate-300">{stars} star</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden" aria-hidden="true">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="w-10 text-right text-slate-500 dark:text-slate-400">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Locations list with state / city filters */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                <i className="bx bx-map-pin text-brand-500 mr-2"></i>
                Locations
                {pagination && <span className="ml-2 text-base font-medium text-slate-500 dark:text-slate-400">({pagination.total})</span>}
              </h2>

              {/* Filters only help when there is more than one state */}
              {states.length > 1 && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="sr-only" htmlFor="brand-state">State</label>
                  <select
                    id="brand-state"
                    value={state}
                    onChange={(e) => changeState(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                  >
                    <option value="">All states</option>
                    {states.map((s) => (
                      <option key={s.state} value={s.state}>{s.state} ({s.count})</option>
                    ))}
                  </select>
                  {/* City filter appears once a state with several cities is picked */}
                  {state && cities.length > 1 && (
                    <>
                      <label className="sr-only" htmlFor="brand-city">City</label>
                      <select
                        id="brand-city"
                        value={city}
                        onChange={(e) => changeCity(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                      >
                        <option value="">All cities</option>
                        {cities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Loading, error, empty or the list itself */}
            {loadingList ? (
              <div className="flex justify-center py-10"><Loader message="Loading locations..." /></div>
            ) : listError ? (
              <p className="text-red-500 py-6 text-center" role="alert">{listError}</p>
            ) : locations.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 py-6 text-center">No locations found for this filter.</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locations.map((loc) => (
                  <li key={loc._id}>
                    {/* Each location card opens that location's own page */}
                    <Link
                      to={`/company/${loc.slug}`}
                      className="flex items-start gap-4 p-4 h-full rounded-xl border border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500/50 hover:shadow-md transition-all duration-200"
                    >
                      <CompanyLogo logo={loc.logo || brand.logo} url={loc.url || brand.website} name={loc.name} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{loc.name}</div>
                        {placeLine(loc) && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            <i className="bx bx-map mr-1"></i>{placeLine(loc)}
                          </div>
                        )}
                        {loc.address && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{loc.address}</div>
                        )}
                        {/* This location's own rating */}
                        <div className="text-sm mt-1">
                          {loc.reviewCount ? (
                            <span className={`font-semibold ${ratingColor(loc.avgRating)}`}>
                              {"★"} {loc.avgRating.toFixed(1)}
                              <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
                                ({loc.reviewCount} review{loc.reviewCount !== 1 ? "s" : ""})
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">No reviews yet</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* More pages available */}
            {!loadingList && pagination?.hasNextPage && (
              <div className="text-center mt-6">
                {moreError && <p className="text-red-500 mb-3" role="alert">{moreError}</p>}
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 rounded-lg font-semibold bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/30 transition-colors duration-200 disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more locations"}
                </button>
              </div>
            )}
          </div>

          {/* Reviews of the brand as a whole; refresh the header rating after changes */}
          <BrandReviews brand={brand} onChanged={refreshSummary} />
        </div>
      </div>
      <Footer />
    </>
  );
}
