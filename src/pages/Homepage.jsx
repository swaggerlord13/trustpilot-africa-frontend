import { API_BASE_URL } from "../config.js";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../pages/Header.jsx";
import AddCompanyModal from "../components/AddCompanyModal.jsx";
import LazyLoadingCompanyCards from "../components/LazyLoadingCompanyCards.jsx";
import OptimizedReviewsPage from "../components/OptimizedReviewsPage.jsx";
import Footer from "../components/Footer.jsx";
import { useToast } from "../components/Toast.jsx";

/* ── Animated counter hook ── */
function useCountUp(target, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasBeenVisible = useRef(false);

  useEffect(() => {
    if (!startOnView || !target) return;
    const el = ref.current;
    if (!el) return;

    // If already visible and target changed (API data arrived), animate immediately
    if (hasBeenVisible.current) {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        if (progress >= 1) {
          setCount(target);
          return;
        }
        const eased = 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(eased * target));
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenVisible.current) {
          hasBeenVisible.current = true;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            if (progress >= 1) {
              setCount(target);
              return;
            }
            // easeOutExpo for snappy feel
            const eased = 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(eased * target));
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, startOnView]);

  return { count, ref };
}

/* ── Single stat card ── */
function StatCard({ icon, value, suffix, label, color }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center group">
      <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
        <i className={`bx ${icon} text-2xl text-white`}></i>
      </div>
      <div className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</div>
    </div>
  );
}


function Homepage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultCompanyName, setDefaultCompanyName] = useState("");
  const [stats, setStats] = useState({ companies: 0, reviews: 0, users: 0, categories: 0 });
  const searchTimeout = useRef(null);

  useEffect(() => {
    // Fetch basic stats only — no more loading ALL companies into memory
    fetch(`${API_BASE_URL}/companies/stats`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setStats({
            companies: data.totalCompanies || 0,
            reviews: data.totalReviews || 0,
            users: data.totalUsers || 0,
            categories: data.totalCategories || 0,
          });
        }
      })
      .catch(e => { /* stats are best-effort */ });
  }, []);

  // Debounced search — calls the backend API instead of filtering locally
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setIsSearching(true);
      fetch(`${API_BASE_URL}/companies/search?q=${encodeURIComponent(search.trim())}&limit=6`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data.companies || []);
          setIsSearching(false);
        })
        .catch(e => {
          console.error("Search error:", e);
          setSuggestions([]);
          setIsSearching(false);
        });
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  // Enter key navigates to the full Browse Companies page with the search query
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/companies?q=${encodeURIComponent(search.trim())}`);
    }
  };

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

  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <>
      <Header />

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <div className="hero-section flex flex-col items-center justify-center w-full min-h-[520px] py-16 px-4 relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-coral-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Subtle decorative circles */}
        <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-brand-100/30 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full bg-coral-100/30 blur-3xl pointer-events-none"></div>

        {/* Logo */}
        <img src="trustpilotafricalogo.png" alt="Logo" className="w-[80px] sm:w-[120px] mb-4 relative z-10" />

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-center mb-2 px-2 text-slate-900 dark:text-white relative z-10 tracking-tight">
          Find Companies You Can Trust
        </h1>
        <p className="text-base sm:text-lg text-slate-500 text-center mb-6 sm:mb-10 max-w-xl relative z-10">
          Real reviews from real people across Africa
        </p>

        {/* Searchbar */}
        <div className="relative w-full max-w-[720px] flex justify-center z-10 px-2">
          <i className="bx bx-search absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-slate-400"></i>
          <input
            type="text"
            placeholder="Search companies, categories, or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full h-14 md:h-16 rounded-2xl border-2 border-slate-200 pl-14 pr-5 text-base md:text-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 shadow-sm"
          />

          {/* Search Results Dropdown */}
          {search.trim() !== "" && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 shadow-xl rounded-xl max-h-80 overflow-y-auto z-50 border border-slate-100 dark:border-slate-700">
              {isSearching ? (
                <div className="flex items-center justify-center py-4 text-slate-400">
                  <i className="bx bx-loader-alt bx-spin mr-2"></i> Searching...
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  {suggestions.map((company) => (
                    <Link
                      key={company._id}
                      to={`/company/${company.slug}`}
                      className="flex items-center gap-3 py-3 px-5 hover:bg-brand-50 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-200"
                    >
                      <i className="bx bx-building text-slate-400 text-lg"></i>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{company.name}</div>
                        {(company.city || company.country) && (
                          <div className="text-xs text-slate-400">{[company.city, company.country].filter(Boolean).join(", ")}</div>
                        )}
                      </div>
                      {company.avgRating > 0 && (
                        <span className="text-xs font-semibold text-amber-500 flex items-center gap-0.5">
                          <i className="bx bxs-star"></i> {company.avgRating.toFixed(1)}
                        </span>
                      )}
                    </Link>
                  ))}
                  {/* See all results link */}
                  <Link
                    to={`/companies?q=${encodeURIComponent(search.trim())}`}
                    className="block py-3 px-5 text-center text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700 transition border-t border-slate-100 dark:border-slate-700"
                  >
                    See all results for &quot;{search}&quot; <i className="bx bx-right-arrow-alt"></i>
                  </Link>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 p-5">
                  <p className="text-slate-400 dark:text-slate-500 italic text-center">
                    No companies found for &quot;{search}&quot;
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to={`/companies?q=${encodeURIComponent(search.trim())}`}
                      className="px-4 py-2 rounded-xl text-brand-600 border border-brand-200 hover:bg-brand-50 transition font-semibold text-sm"
                    >
                      <i className="bx bx-search mr-1"></i>
                      Full Search
                    </Link>
                    <button
                      className="px-4 py-2 rounded-xl text-white bg-brand-500 hover:bg-brand-600 transition font-semibold text-sm"
                      onClick={() => {
                        setDefaultCompanyName(search);
                        setIsModalOpen(true);
                      }}
                    >
                      <i className="bx bx-plus mr-1"></i>
                      Add Company
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-10 text-xs sm:text-sm text-slate-400 relative z-10">
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


      {/* ═══════════════════════ STATS BAR ═══════════════════════ */}
      <section className="py-14 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          <StatCard
            icon="bxs-building-house"
            value={stats.companies || 50}
            suffix="+"
            label="Companies Listed"
            color="bg-brand-500"
          />
          <StatCard
            icon="bxs-star"
            value={stats.reviews || 200}
            suffix="+"
            label="Reviews Written"
            color="bg-coral-500"
          />
          <StatCard
            icon="bxs-user-check"
            value={stats.users || 100}
            suffix="+"
            label="Verified Users"
            color="bg-emerald-500"
          />
          <StatCard
            icon="bxs-category"
            value={stats.categories || 12}
            suffix="+"
            label="Categories"
            color="bg-violet-500"
          />
        </div>
      </section>


      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section className="py-16 md:py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 mb-4">
              Simple &amp; Transparent
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight text-center">
              How TrustPilot Africa Works
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Three simple steps to help you make smarter decisions or grow your business
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden sm:block absolute top-16 left-[16.6%] right-[16.6%] h-0.5 bg-gradient-to-r from-brand-200 via-coral-200 to-emerald-200 dark:from-brand-500/30 dark:via-coral-500/30 dark:to-emerald-500/30"></div>

            {[
              {
                step: "01",
                icon: "bx-search-alt",
                color: "bg-brand-500",
                ring: "ring-brand-100 dark:ring-brand-500/20",
                title: "Search or Add",
                desc: "Find a company by name or category. Not listed yet? Add it in seconds and be the first to review."
              },
              {
                step: "02",
                icon: "bx-edit-alt",
                color: "bg-coral-500",
                ring: "ring-coral-100 dark:ring-coral-500/20",
                title: "Write Your Review",
                desc: "Rate 1 to 5 stars and share your honest experience. Every review is tied to a real user account."
              },
              {
                step: "03",
                icon: "bx-trending-up",
                color: "bg-emerald-500",
                ring: "ring-emerald-100 dark:ring-emerald-500/20",
                title: "Help Others Decide",
                desc: "Your review builds the community score. The more reviews, the clearer the picture for everyone."
              }
            ].map((item) => (
              <div key={item.step} className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center hover:shadow-lg transition-shadow group">
                <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl ${item.color} ring-8 ${item.ring} flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform`}>
                  <i className={`bx ${item.icon} text-3xl text-white`}></i>
                </div>
                <span className="text-xs font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Step {item.step}</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════ LATEST REVIEWS (with slider) ═══════════════════════ */}
      <section className="py-14 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <OptimizedReviewsPage />
        </div>
      </section>


      {/* ═══════════════════════ CTA BANNER ═══════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700"></div>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm text-white/90 font-medium mb-6 backdrop-blur-sm">
            <i className="bx bxs-megaphone"></i>
            Every Review Matters
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 tracking-tight text-center">
            {isLoggedIn ? "Your Voice Shapes Trust Across Africa" : "Join Africa's Fastest Growing Review Community"}
          </h2>
          <p className="text-brand-100 text-base md:text-lg max-w-2xl mx-auto mb-8">
            {isLoggedIn
              ? "You're already part of the movement. Every honest review you write helps fellow Africans make better decisions."
              : "Thousands of Africans are sharing honest experiences. Your next review could save someone from a bad deal — or help a great business get noticed."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <Link
                to="/categories"
                className="px-8 py-3.5 bg-white text-brand-600 rounded-xl font-bold hover:bg-brand-50 transition-colors shadow-lg shadow-brand-800/20 text-sm md:text-base"
              >
                <i className="bx bx-edit mr-1.5"></i>
                Write a Review Now
              </Link>
            ) : (
              <Link
                to="/register"
                className="px-8 py-3.5 bg-white text-brand-600 rounded-xl font-bold hover:bg-brand-50 transition-colors shadow-lg shadow-brand-800/20 text-sm md:text-base"
              >
                <i className="bx bx-user-plus mr-1.5"></i>
                Create Free Account
              </Link>
            )}
            <Link
              to="/browse-reviews"
              className="px-8 py-3.5 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm md:text-base"
            >
              <i className="bx bx-book-open mr-1.5"></i>
              Browse All Reviews
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════ BEST BY CATEGORY ═══════════════════════ */}
      <LazyLoadingCompanyCards />


      {/* ═══════════════════════ WHY TRUSTPILOT AFRICA ═══════════════════════ */}
      <section className="py-16 md:py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-coral-50 text-coral-600 dark:bg-coral-500/20 dark:text-coral-300 mb-4">
              Why Choose Us
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight text-center">
              Built Different. Built for Africa.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              We're not another review platform. We're the review platform that Africa actually needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "bxs-shield-check",
                color: "text-brand-500",
                bg: "bg-brand-50 dark:bg-brand-500/15",
                title: "100% Verified Accounts",
                desc: "Every reviewer must create a real account. No anonymous fake reviews, no bots."
              },
              {
                icon: "bxs-star",
                color: "text-coral-500",
                bg: "bg-coral-50 dark:bg-coral-500/15",
                title: "No Pay-to-Play",
                desc: "Companies cannot pay to remove negative reviews or boost ratings. Fairness is built in."
              },
              {
                icon: "bxs-map-alt",
                color: "text-emerald-500",
                bg: "bg-emerald-50 dark:bg-emerald-500/15",
                title: "Africa-Focused",
                desc: "Built for African markets. We understand the unique business landscape from Lagos to Nairobi to Johannesburg."
              },
              {
                icon: "bxs-bolt",
                color: "text-amber-500",
                bg: "bg-amber-50 dark:bg-amber-500/15",
                title: "Instant Company Listings",
                desc: "Company not listed? Add it in seconds and be the first to review. No gatekeeping."
              },
              {
                icon: "bxs-badge-check",
                color: "text-violet-500",
                bg: "bg-violet-50 dark:bg-violet-500/15",
                title: "Business Claiming",
                desc: "Own a listed business? Claim your page to respond to reviews and build your reputation."
              },
              {
                icon: "bxs-bar-chart-alt-2",
                color: "text-sky-500",
                bg: "bg-sky-50 dark:bg-sky-500/15",
                title: "Transparent Ratings",
                desc: "Star ratings are averaged from all user reviews. Every single rating is public and verifiable."
              }
            ].map((item) => (
              <div key={item.title} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all hover:-translate-y-0.5 group">
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <i className={`bx ${item.icon} text-2xl ${item.color}`}></i>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section className="py-16 md:py-20 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="text-5xl mb-5">&#127757;</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-4 tracking-tight text-center">
            {isLoggedIn ? "Ready to Review Your Next Experience?" : "Ready to Make Smarter Choices?"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            {isLoggedIn
              ? "Find any company, share your experience, and help millions of Africans make informed decisions."
              : "Join a growing community of honest reviewers building trust across Africa. It takes less than a minute to sign up."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <Link
                to="/categories"
                className="px-8 py-3.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25 text-sm md:text-base"
              >
                Browse Companies
              </Link>
            ) : (
              <Link
                to="/register"
                className="px-8 py-3.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25 text-sm md:text-base"
              >
                Sign Up Free
              </Link>
            )}
            <Link
              to="/about"
              className="px-8 py-3.5 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm md:text-base"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>


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
