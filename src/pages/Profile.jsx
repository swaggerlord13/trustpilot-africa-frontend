import api, { API_BASE_URL } from "../api.js";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import ReviewBox from "../components/ReviewBox";
import Footer from "../components/Footer.jsx";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profileImage: "",
    password: "",
  });

  // New states for image upload
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const profileImageInputRef = useRef(null);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  // My claimed companies
  const [myCompanies, setMyCompanies] = useState([]);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, type: "", message: "" });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (file) => {
    if (!file) return;

    setProfileImageUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('profileImage', file);

    try {
      const token = localStorage.getItem("token");
      const response = await api.post(`${API_BASE_URL}/upload/user-profile`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      const imageUrl = response.data.imageUrl;
      setFormData(prev => ({ ...prev, profileImage: imageUrl }));
      setProfileImagePreview(imageUrl);
      showToast('success', 'Profile image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      showToast('error', 'Failed to upload profile image. Please try again.');
    } finally {
      setProfileImageUploading(false);
    }
  };

  // Fetch logged-in user and their reviews
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        // Get user profile
        const userRes = await api.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(userRes.data);
        setFormData({
          name: userRes.data.name,
          email: userRes.data.email,
          profileImage: userRes.data.profileImage || "",
          password: "",
        });
        setProfileImagePreview(userRes.data.profileImage || "");

        // Get user's reviews
        const reviewsRes = await api.get(
          `${API_BASE_URL}/reviews/user/${userRes.data._id}`
        );

        // Map reviews to ReviewBox format
        const mappedReviews = reviewsRes.data.map((review) => ({
          _id: review._id,
          title: review.title || "Review",
          comment: review.comment,
          rating: review.rating,
          user: userRes.data.name,
          image: userRes.data.profileImage || "https://via.placeholder.com/100",
          date: new Date(review.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          company: review.company?.name,
          url: review.company?.url,
          companyimage: review.company?.logo || "https://via.placeholder.com/150",
          category: review.company?.category?.name || "General",
        }));

        setUserReviews(mappedReviews);

        // Fetch claimed companies
        try {
          const claimsRes = await api.get(`${API_BASE_URL}/company-claims/my-companies`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // API returns a plain array, not { companies: [...] }
          setMyCompanies(Array.isArray(claimsRes.data) ? claimsRes.data : []);
        } catch (err) {
          console.log("No claimed companies");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle form change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(
        `${API_BASE_URL}/auth/me`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        profileImage: res.data.profileImage || "",
        isAdmin: res.data.isAdmin || false
      }));
      
      setShowModal(false);
      showToast("success", "Profile updated successfully!");
    } catch (err) {
      showToast("error", err.response?.data?.error || "Something went wrong");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg text-white transition-all duration-300 ${
          toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
        }`}>
          <span className="text-xl">
            <i className={toast.type === "success" ? "bx bxs-check-circle" : "bx bxs-error-circle"}></i>
          </span>
          <div>
            <p className="font-semibold text-sm">
              {toast.type === "success" ? "Success!" : "Error!"}
            </p>
            <p className="text-sm opacity-90">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast({ show: false, type: "", message: "" })}
            className="ml-3 text-white/80 hover:text-white text-lg font-bold"
          >
            <i className="bx bx-x"></i>
          </button>
        </div>
      )}

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8 border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Profile Image */}
              <div className="flex flex-col items-center">
                <img
                  src={user?.profileImage || "https://avatar.iran.liara.run/public"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-brand-500"
                  onError={(e) => {
                    e.target.src = "https://avatar.iran.liara.run/public";
                  }}
                />
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 px-6 py-2 bg-brand-500 text-white rounded-lg shadow hover:bg-brand-600 transition-colors duration-200 font-semibold"
                >
                  Edit Profile
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {user?.name}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-4">{user?.email}</p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 max-w-md mx-auto md:mx-0">
                  <div className="text-center p-4 bg-brand-50 dark:bg-brand-500/20 rounded-xl border border-brand-100 dark:border-brand-500/30">
                    <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                      {userReviews.length}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      Review{userReviews.length !== 1 ? `s` : ''} Written
                    </div>
                  </div>
                  <div className="text-center p-4 bg-coral-50 dark:bg-coral-500/20 rounded-xl border border-coral-100 dark:border-coral-500/30">
                    <div className="text-2xl font-bold text-coral-500 dark:text-coral-400">
                      {userReviews.reduce((sum, review) => sum + review.rating, 0)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Total Stars Given</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Reviews Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-8 border border-slate-100 dark:border-slate-700">
            {/* My Companies Section */}
            {myCompanies.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                  <i className="bx bx-buildings text-brand-500 mr-2 text-xl"></i>
                  My Companies
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myCompanies.map((comp) => (
                    <Link
                      key={comp._id}
                      to={`/company-dashboard/${comp._id}`}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-brand-300 hover:shadow-md transition-all duration-200"
                    >
                      <img
                        src={comp.logo || "https://via.placeholder.com/48?text=Co"}
                        alt={comp.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-600 flex-shrink-0"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/48?text=Co"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{comp.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{comp.category?.name || "General"}</p>
                      </div>
                      <i className="bx bx-tachometer text-brand-500 text-xl flex-shrink-0"></i>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
              <i className="bx bxs-edit-alt text-brand-500 mr-3 text-2xl"></i>
              Your Reviews ({userReviews.length})
            </h2>

            {userReviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="bx bx-edit text-slate-400 dark:text-slate-500 text-3xl"></i>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg mb-4">
                  You haven't written any reviews yet
                </p>
                <a
                  href="/"
                  className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200 font-semibold"
                >
                  Find Companies to Review
                </a>
              </div>
            ) : (
              <div className="reviews">
                <div className="reviewscomments-row">
                  {userReviews.map((review, index) => (
                    <ReviewBox
                      key={index}
                      _id={review._id}
                      image={review.image}
                      company={review.company}
                      url={review.url}
                      title={review.title}
                      comment={review.comment}
                      rating={review.rating}
                      user={review.user}
                      date={review.date}
                      companyimage={review.companyimage}
                      category={review.category}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4" style={{ zIndex: 200 }}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-600">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">
                  Edit Profile
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name"
                      className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all duration-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all duration-200"
                      required
                    />
                  </div>
                  
                  {/* Profile Image Upload */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Profile Image
                    </label>
                    
                    {/* Image Preview */}
                    {profileImagePreview && (
                      <div className="flex justify-center">
                        <img
                          src={profileImagePreview}
                          alt="Profile Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                        />
                      </div>
                    )}
                    
                    {/* File Input */}
                    <input
                      type="file"
                      ref={profileImageInputRef}
                      onChange={(e) => handleProfileImageUpload(e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {/* Upload Button */}
                    <button
                      type="button"
                      onClick={() => profileImageInputRef.current?.click()}
                      disabled={profileImageUploading}
                      className="w-full p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-brand-400 transition-colors duration-200 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 disabled:opacity-50"
                    >
                      {profileImageUploading ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="bx bx-camera text-lg"></i>
                          {profileImagePreview ? 'Change Photo' : 'Upload Profile Photo'}
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200 font-semibold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
