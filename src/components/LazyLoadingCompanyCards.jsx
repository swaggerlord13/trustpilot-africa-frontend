import { API_BASE_URL } from "../config.js";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Loader from "./Loader";
import StarRating from "./StarRatings";

// Individual Category Section Component with Intersection Observer
const CategorySection = ({ category, companies, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="category-section mb-14 min-h-[400px]">
      {isVisible ? (
        <>
          {/* Category Header */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1.5">
              Best in {category.name}
            </h2>
            <p className="text-slate-500">
              Top {companies.length} rated companies in {category.name}
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-brand-500 to-coral-400 mt-3 rounded-full"></div>
          </div>

          {/* Company Cards */}
          <div className="mb-8 mx-1">
            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-3 pl-3">
              {companies.map((company, companyIndex) => (
                <CompanyCard key={company.companyId} company={company} ranking={companyIndex + 1} />
              ))}
            </div>

            {/* Mobile Horizontal Scroll */}
            <div className="md:hidden">
              <div className="flex gap-4 overflow-x-auto pt-3 pl-3 pb-4 scrollbar-hide snap-x snap-mandatory"
                   style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {companies.map((company, companyIndex) => (
                  <div key={company.companyId} className="flex-shrink-0 snap-center">
                    <CompanyCard company={company} ranking={companyIndex + 1} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* View All */}
          <div className="text-center">
            <Link
              to={`/categories/${category.slug}`}
              className="inline-flex items-center px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors duration-200 font-semibold text-sm"
            >
              View All {category.name} Companies
              <i className="bx bx-right-arrow-alt ml-1 text-lg"></i>
            </Link>
          </div>
        </>
      ) : (
        /* Loading skeleton */
        <div className="animate-pulse">
          <div className="h-7 bg-slate-200 rounded-lg w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-2xl h-64"></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Company Card Component
const CompanyCard = ({ company, ranking }) => {
  return (
    <Link
      to={company.url}
      className="company-card bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 md:p-5 relative group hover:-translate-y-1 transform w-[260px] h-[280px] md:w-auto md:h-[300px] flex flex-col"
    >
      {/* Ranking Badge */}
      <div className="absolute -top-2.5 -left-2.5 bg-gradient-to-r from-coral-400 to-coral-500 text-white text-sm md:text-base font-bold rounded-full w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shadow-md z-10">
        {ranking || '?'}
      </div>

      {/* Company Logo */}
      <div className="flex justify-center mb-3">
        <img
          src={company.companyimage}
          alt={company.company}
          className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-slate-100"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/150?text=Company+Logo";
          }}
        />
      </div>

      {/* Company Name */}
      <h3 className="text-base md:text-lg font-semibold text-slate-800 text-center mb-2 group-hover:text-brand-600 transition-colors line-clamp-2 flex-shrink-0">
        {company.company}
      </h3>

      {/* Rating & Stats */}
      <div className="text-center flex-grow flex flex-col justify-center">
        <div className="flex justify-center mb-1">
          <div className="scale-90 md:scale-100">
            <StarRating rating={Math.round(company.avgRating)} />
          </div>
        </div>

        <div className="text-xl md:text-2xl font-bold text-slate-800 mb-0.5">
          {company.avgRating}
        </div>

        <div className="text-sm text-slate-400 mb-2">
          {company.reviewCount} review{company.reviewCount !== 1 ? 's' : ''}
        </div>

        <div>
          <span className="inline-block px-2.5 py-1 bg-brand-50 text-brand-700 text-xs md:text-sm font-medium rounded-lg">
            {company.category}
          </span>
        </div>
      </div>
    </Link>
  );
};

// Main Component
export default function LazyLoadingCompanyCards() {
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRandomCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/companies/best-by-category`);
        setCategoryData(response.data.categories || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchRandomCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader message="Loading Top Companies..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4"><i className="bx bx-error-circle text-slate-300"></i></div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">Error Loading Data</h3>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (categoryData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4"><i className="bx bxs-building-house text-slate-300"></i></div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Companies Available</h3>
        <p className="text-slate-500">No companies have reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="lazy-loading-company-cards py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {categoryData.map((categoryGroup, index) => (
          <CategorySection
            key={`${categoryGroup.category.slug}-${index}`}
            category={categoryGroup.category}
            companies={categoryGroup.companies}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
