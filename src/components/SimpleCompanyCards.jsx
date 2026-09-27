// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import axios from "axios";
// import Loader from "./Loader";
// import StarRating from "./StarRatings";

// export default function SimpleCompanyCards() {
//   const [categoryData, setCategoryData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchBestCompanies = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/companies/best-by-category');
//         setCategoryData(response.data.categories || []);
//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching best companies:", err);
//         setError(err.message);
//         setLoading(false);
//       }
//     };

//     fetchBestCompanies();
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center py-20">
//         <Loader message="Loading Top Companies..." />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-12">
//         <div className="text-6xl mb-4">⚠️</div>
//         <h3 className="text-xl font-semibold text-gray-700 mb-2">
//           Error Loading Data
//         </h3>
//         <p className="text-gray-500">{error}</p>
//       </div>
//     );
//   }

//   if (categoryData.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <div className="text-6xl mb-4">🏢</div>
//         <h3 className="text-xl font-semibold text-gray-700 mb-2">
//           No Companies Available
//         </h3>
//         <p className="text-gray-500">
//           No companies have reviews yet. Be the first to add a company!
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="simple-company-cards py-8">
//       <div className="max-w-7xl mx-auto px-4">
//         {categoryData.map(({ category, reviews }) => (
//           <div key={category.slug} className="category-section mb-12">
//             {/* Category Header */}
//             <div className="category-header mb-8">
//               <h2 className="text-3xl font-bold text-gray-800 mb-2">
//                 BEST IN {category.name.toUpperCase()}
//               </h2>
//               <p className="text-gray-600">
//                 Top rated companies in {category.name}
//               </p>
//               <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mt-2"></div>
//             </div>

//             {/* Company Cards Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
//               {reviews.map((review, index) => (
//                 <Link 
//                   key={review._id} 
//                   to={review.url}
//                   className="company-card bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 relative group hover:scale-105 transform transition-transform"
//                 >
//                   {/* Ranking Badge */}
//                   <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
//                     #{index + 1}
//                   </div>

//                   {/* Company Logo */}
//                   <div className="flex justify-center mb-4">
//                     <img
//                       src={review.companyimage}
//                       alt={review.company}
//                       className="w-16 h-16 rounded-lg object-cover border border-gray-200"
//                       onError={(e) => {
//                         e.target.src = "https://via.placeholder.com/150?text=Company+Logo";
//                       }}
//                     />
//                   </div>

//                   {/* Company Name */}
//                   <h3 className="text-lg font-semibold text-gray-800 text-center mb-3 group-hover:text-[#1B6B3A] transition-colors">
//                     {review.company}
//                   </h3>

//                   {/* Rating and Stats */}
//                   <div className="text-center">
//                     {/* Star Rating */}
//                     <div className="flex justify-center mb-2">
//                       <StarRating rating={Math.round(review.avgRating)} />
//                     </div>

//                     {/* Average Rating Number */}
//                     <div className="text-2xl font-bold text-gray-800 mb-1">
//                       {review.avgRating}
//                     </div>

//                     {/* Review Count */}
//                     <div className="text-sm text-gray-500">
//                       Based on {review.reviewCount} review{review.reviewCount !== 1 ? 's' : ''}
//                     </div>

//                     {/* Category Tag */}
//                     <div className="mt-3">
//                       <span className="inline-block px-3 py-1 bg-[#e8f5e9] text-[#14532d] text-xs font-medium rounded-full">
//                         {review.category}
//                       </span>
//                     </div>
//                   </div>
//                 </Link>
//               ))}
//             </div>

//             {/* View All Button */}
//             <div className="text-center">
//               <Link
//                 to={`/categories/${category.slug}`}
//                 className="inline-flex items-center px-6 py-3 bg-[#1B6B3A] text-white rounded-lg hover:bg-[#14532d] transition-colors duration-200 font-semibold"
//               >
//                 View All {category.name} Companies →
//               </Link>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }