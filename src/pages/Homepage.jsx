import { API_BASE_URL } from "../config.js";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../pages/Header.jsx";
import AddCompanyModal from "../components/AddCompanyModal.jsx";
import LazyLoadingCompanyCards from "../components/LazyLoadingCompanyCards.jsx";
import OptimizedReviewsPage from "../components/OptimizedReviewsPage.jsx";
import Footer from "../components/Footer.jsx";
import { useToast } from "../components/Toast.jsx";

function Homepage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultCompanyName, setDefaultCompanyName] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/companies`)
      .then(res => res.json())
      .then(data => setCompanies(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching companies:", err));
  }, []);

  useEffect(() => {
    const filteredList = companies.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filteredList);
  }, [search, companies]);

  const handleAddCompany = async ({ name, url }) => {
    const newCompany = { name, url: url || "" };
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompany),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create company");
      }
      const savedCompany = await response.json();
      setCompanies(prev => [savedCompany, ...prev]);
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

      {/* Hero Section */}
      <div className="hero-section flex flex-col items-center justify-center w-full min-h-[520px] py-16 px-4 relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-coral-50">
        {/* Subtle decorative circles */}
        <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-brand-100/30 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full bg-coral-100/30 blur-3xl pointer-events-none"></div>

        {/* Logo */}
        <img src="trustpilotafricalogo.png" alt="Logo" className="w-[160px] mb-6 relative z-10" />

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-3 px-2 text-slate-900 relative z-10 tracking-tight">
          Find Companies You Can Trust
        </h1>
        <p className="text-lg text-slate-500 text-center mb-10 max-w-xl relative z-10">
          Real reviews from real people across Africa
        </p>

        {/* Searchbar */}
        <div className="relative w-[720px] max-w-full flex justify-center z-10">
          <i className="bx bx-search absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-slate-400"></i>
          <input
            type="text"
            placeholder="Search for a company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 md:h-16 rounded-2xl border-2 border-slate-200 pl-14 pr-5 text-base md:text-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all bg-white shadow-sm"
          />

          {/* Search Results Dropdown */}
          {search.trim() !== "" && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white shadow-xl rounded-xl max-h-60 overflow-y-auto z-50 border border-slate-100">
              {filtered.length > 0 ? (
                filtered.map((company) => (
                  <Link
                    key={company._id}
                    to={`/company/${company.slug}`}
                    className="block py-3 px-5 hover:bg-brand-50 transition text-slate-700"
                  >
                    {company.name}
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center gap-3 p-5">
                  <p className="text-slate-400 italic text-center">
                    No companies found for "{search}"
                  </p>
                  <button
                    className="px-5 py-2.5 rounded-xl text-white bg-brand-500 hover:bg-brand-600 transition font-semibold text-sm"
                    onClick={() => {
                      setDefaultCompanyName(search);
                      setIsModalOpen(true);
                    }}
                  >
                    <i className="bx bx-plus mr-1"></i>
                    Add This Company
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-6 mt-10 text-sm text-slate-400 relative z-10">
          <span className="flex items-center gap-1.5">
            <i className="bx bxs-shield-check text-brand-500 text-lg"></i>
            Verified Reviews
          </span>
          <span className="flex items-center gap-1.5">
            <i className="bx bxs-group text-brand-500 text-lg"></i>
            Trusted Community
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <i className="bx bxs-star text-coral-500 text-lg"></i>
            Honest Ratings
          </span>
        </div>
      </div>

      {/* Latest Reviews Section */}
      <div className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <OptimizedReviewsPage />
        </div>
      </div>

      {/* Best by Category */}
      <LazyLoadingCompanyCards />

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCompany={handleAddCompany}
        defaultName={defaultCompanyName}
      />

      <Footer />
    </>
  );
}

export default Homepage;
