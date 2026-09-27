import { API_BASE_URL } from "../config.js";
import '../styles/Login.css';
import Header from '../pages/Header.jsx';
import { Link } from 'react-router-dom';
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import { useToast } from "../components/Toast.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  // If user is already logged in, redirect to homepage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      navigate("/", { replace: true });
    }
  }, []);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error. Please try again later.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage || "",
        isAdmin: data.isAdmin || false
      }));

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Check for pending review from before login
      const pendingReview = localStorage.getItem("pendingReview");
      if (pendingReview) {
        try {
          const review = JSON.parse(pendingReview);
          showToast("Welcome back! Submitting your review...", "success");
          
          const reviewRes = await axios.post(
            `${API_BASE_URL}/reviews`,
            {
              companyId: review.companyId,
              rating: review.rating,
              comment: review.comment,
              title: review.title
            },
            { headers: { Authorization: `Bearer ${data.token}` } }
          );
          
          localStorage.removeItem("pendingReview");
          showToast("Your review has been posted!", "success");
          
          setTimeout(() => {
            navigate(review.returnUrl || "/", { replace: true });
            window.location.reload();
          }, 1500);
        } catch (reviewErr) {
          console.error("Failed to auto-submit review:", reviewErr);
          localStorage.removeItem("pendingReview");
          showToast("Welcome back! But we couldn't post your review — please try again.", "warning");
          setTimeout(() => {
            navigate("/", { replace: true });
            window.location.reload();
          }, 2000);
        }
      } else {
        setSuccess("Welcome back! Redirecting...");
        setTimeout(() => {
          navigate("/", { replace: true });
          window.location.reload();
        }, 1500);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <>
      <Header />

      {/* Toast Notifications */}
      {success && (
        <div className="toast-notification success">
          <div className="toast-icon">
            <i className='bx bxs-check-circle'></i>
          </div>
          <div className="toast-content">
            <h4>Success!</h4>
            <p>{success}</p>
          </div>
          <button className="toast-close" onClick={() => setSuccess("")}>
            <i className='bx bx-x'></i>
          </button>
        </div>
      )}

      {error && (
        <div className="toast-notification error">
          <div className="toast-icon">
            <i className='bx bxs-error-circle'></i>
          </div>
          <div className="toast-content">
            <h4>Error!</h4>
            <p>{error}</p>
          </div>
          <button className="toast-close" onClick={() => setError("")}>
            <i className='bx bx-x'></i>
          </button>
        </div>
      )}

      <div className="modern-login-container">
        <div className="login-wrapper">
          <div className="login-card">
            <div className="login-header">
              <div className="logo-icon">
                <i className='bx bxs-star'></i>
              </div>
              <h1>Welcome Back</h1>
              <p>Sign in to continue to TrustPilot Africa</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <div className="input-wrapper">
                  <i className='bx bxs-envelope'></i>
                  <input
                    type="email"
                    placeholder='Email Address'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="modern-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-wrapper">
                  <i className='bx bxs-lock-alt'></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder='Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="modern-input with-toggle"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    <i className={showPassword ? 'bx bxs-hide' : 'bx bxs-show'}></i>
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type='submit'
                className='modern-submit-btn'
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-content">
                    <div className="spinner"></div>
                    Signing in...
                  </span>
                ) : (
                  <span className="btn-content">
                    Sign In
                    <i className='bx bx-right-arrow-alt'></i>
                  </span>
                )}
              </button>
            </form>

            <div className="divider">
              <span>Or continue with</span>
            </div>

            <div className="social-login-buttons">
              <button type="button" className="social-btn google" title="Sign in with Google">
                <i className='bx bxl-google'></i>
              </button>
              <button type="button" className="social-btn facebook" title="Sign in with Facebook">
                <i className='bx bxl-facebook'></i>
              </button>
              <button type="button" className="social-btn apple" title="Sign in with Apple">
                <i className='bx bxl-apple'></i>
              </button>
            </div>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="switch-link">
                  Create Account
                </Link>
              </p>
              <p style={{ marginTop: '0.5rem' }}>
                Own a business?{' '}
                <Link to="/register-business" className="switch-link" style={{ color: '#FF6B4A' }}>
                  Register as a Business
                </Link>
              </p>
            </div>
          </div>

          {/* Side decoration */}
          <div className="login-decoration">
            <div className="decoration-content">
              <h2>Join Africa's Most Trusted Review Platform</h2>
              <p>Share your experiences and help others make informed decisions</p>
              <div className="features">
                <div className="feature">
                  <i className='bx bxs-shield-check'></i>
                  <span>Verified Reviews</span>
                </div>
                <div className="feature">
                  <i className='bx bxs-user-check'></i>
                  <span>Trusted Community</span>
                </div>
                <div className="feature">
                  <i className='bx bxs-star'></i>
                  <span>Make an Impact</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
