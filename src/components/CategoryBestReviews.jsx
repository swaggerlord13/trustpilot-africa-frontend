import api, { API_BASE_URL } from "../api.js";
import ReviewBox from "./ReviewBox";
import { useState, useEffect } from "react";
import Loader from "./Loader";

export default function CategoryBestReviews() {
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define the categories you want to showcase
  const featuredCategories = [
    { name: "Service Provider", slug: "service-provider", emoji: "🔧" },
    { name: "Search Engine", slug: "search-engine", emoji: "🍕" },
    { name: "Clothing", slug: "clothing", emoji: "👕" },
    { name: "Internet", slug: "internet", emoji: "🌐" },
    { name: "Housing", slug: "housing", emoji: "🏠" }
  ];

  useEffect(() => {
    const fetchCategoryBestReviews = async () => {
      try {
        console.log("Fetching best companies and reviews by category");
        
        const categoryResults = [];

        for (const category of featuredCategories) {
          try {
            // Step 1: Get all companies in this category
            const companiesRes = await api.get(
              `${API_BASE_URL}/companies?category=${category.slug}`
            );
            
            if (companiesRes.data.length === 0) {
              console.log(`No companies found for category: ${category.name}`);
              continue;
            }

            // Step 2: Get reviews for all companies in this category and calculate ratings
            const companiesWithRatings = await Promise.all(
              companiesRes.data.map(async (company) => {
                try {
                  const reviewsRes = await api.get(
                    `${API_BASE_URL}/reviews/company/${company._id}`
                  );
                  
                  const reviews = reviewsRes.data;
                  if (reviews.length === 0) {
                    return { ...company, avgRating: 0, reviewCount: 0, bestReview: null };
                  }

                  // Calculate average rating
                  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
                  
                  // Get the best review (highest rating, most recent if tied)
                  const bestReview = reviews
                    .sort((a, b) => {
                      if (b.rating !== a.rating) return b.rating - a.rating;
                      return new Date(b.createdAt) - new Date(a.createdAt);
                    })[0];

                  return {
                    ...company,
                    avgRating: parseFloat(avgRating.toFixed(1)),
                    reviewCount: reviews.length,
                    bestReview
                  };
                } catch (err) {
                  console.error(`Error fetching reviews for company ${company._id}:`, err);
                  return { ...company, avgRating: 0, reviewCount: 0, bestReview: null };
                }
              })
            );

            // Step 3: Sort companies by rating (highest first) and review count
            const topCompanies = companiesWithRatings
              .filter(company => company.reviewCount > 0)
              .sort((a, b) => {
                if (b.avgRating !== a.avgRating) {
                  return b.avgRating - a.avgRating;
                }
                return b.reviewCount - a.reviewCount;
              })
              .slice(0, 25);

            // Step 4: Map to review format for display
            const mappedReviews = topCompanies
              .filter(company => company.bestReview)
              .map((company) => ({
                _id: company.bestReview._id,
                title: company.bestReview.title || "Review",
                comment: company.bestReview.comment,
                rating: company.bestReview.rating,
                user: company.bestReview.user?.name || "Anonymous",
                image: company.bestReview.user?.profileImage || "https://via.placeholder.com/100?text=User",
                date: new Date(company.bestReview.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                company: company.name,
                url: `/company/${company.slug || company._id}`,
                companyimage: company.logo || company.companyImage || (() => {
                  try {
                    const url = company.url || company.website || "";
                    if (url) {
                      const cleaned = url.startsWith("http") ? url : "https://" + url;
                      const domain = new URL(cleaned).hostname.replace(/^www\./, "");
                      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                    }
                  } catch {}
                  return "https://via.placeholder.com/150?text=Company+Logo";
                })(),
                category: category.name,
                companyUrl: company.url || company.website || "",
                avgRating: company.avgRating,
                reviewCount: company.reviewCount,
                createdAt: company.bestReview.createdAt
              }));

            if (mappedReviews.length > 0) {
              categoryResults.push({
                category: {
                  ...category,
                  totalCompanies: topCompanies.length
                },
                reviews: mappedReviews
              });
            }

            console.log(`${category.name}: ${mappedReviews.length} reviews from top companies`);
            
          } catch (err) {
            console.error(`Error fetching data for category ${category.name}:`, err);
          }
        }

        setCategoryData(categoryResults);
        setLoading(false);
        
      } catch (err) {
        console.error("Error fetching category best reviews:", err);
        setLoading(false);
      }
    };

    fetchCategoryBestReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader message="Loading Best Reviews by Category..." />
      </div>
    );
  }

  return (
    <div className="category-best-reviews">
      {categoryData.map(({ category, reviews }) => (
        <div key={category.slug} className="category-section mb-12">
          {/* Category Header */}
          <div className="category-header mb-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-3">
              <span className="text-4xl">{category.emoji}</span>
              BEST IN {category.name.toUpperCase()}
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Top {reviews.length} highest-rated companies in {category.name} 
              {category.totalCompanies > reviews.length && ` (from ${category.totalCompanies} reviewed companies)`}
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-brand-500 via-brand-300 to-coral-500 mt-2"></div>
          </div>

          {/* Reviews Grid */}
          <div className="reviews">
            <div className="reviewscomments-row">
              {reviews.map((review, index) => (
                <div key={review._id} className="review-with-ranking relative">
                  {/* Ranking Badge */}
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center z-10 shadow-lg">
                    #{index + 1}
                  </div>
                  
                  {/* Company Rating Badge */}
                  <div className="absolute -top-2 -right-2 bg-brand-500 text-white text-xs font-bold rounded-full px-2 py-1 z-10 shadow-lg">
                    <i className="bx bxs-star text-amber-300 mr-0.5"></i> {review.avgRating}
                  </div>
                  
                  <ReviewBox
                    image={review.image}
                    company={review.company}
                    url={review.url}
                    title={review.title}
                    comment={review.comment}
                    rating={review.rating}
                    user={review.user}
                    date={review.date}
                    companyimage={review.companyimage}
                    companyUrl={review.companyUrl}
                    category={review.category}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Category Footer */}
          <div className="text-center mt-6">
            <a 
              href={`/categories/${category.slug}`}
              className="inline-flex items-center px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200 font-semibold"
            >
              View All {category.name} Companies →
            </a>
          </div>
        </div>
      ))}

      {categoryData.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-50 rounded-full flex items-center justify-center">
            <i className="bx bx-trophy text-3xl text-brand-500"></i>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
            No featured categories available
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            We're working on featuring the best companies across different categories.
          </p>
        </div>
      )}
    </div>
  );
}
