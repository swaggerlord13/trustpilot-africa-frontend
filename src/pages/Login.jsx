import { API_BASE_URL } from "../api.js";
import '../styles/Login.css';
import Header from '../pages/Header.jsx';
import { Link } from 'react-router-dom';
import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const HAS_GOOGLE = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
import Footer from "../components/Footer.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const navigate = useNavigate();

  // Already logged in? Send to homepage
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/" replace />;

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

      // Safely parse response: handle non-JSON responses (e.g. rate limiter HTML)
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error. Please try again later.");
      }

      if (!res.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
          setVerificationEmail(data.email);
          setError("Please verify your email before logging in. Check your inbox for the verification link.");
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Invalid email or password");
      }

      // Save token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage || "",
        isAdmin: data.isAdmin || false
      }));

      // If remember me is checked, save email
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Show success message
      setSuccess("Welcome back! Redirecting...");

      // Redirect after showing success
      setTimeout(() => {
        navigate("/", { replace: true });
        window.location.reload();
      }, 1500);

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

  // Resend verification email
  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess("");
    try {
      await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });
      setResendSuccess("Verification email sent! Check your inbox.");
      setError("");
    } catch (err) {
      setError("Could not resend verification email. Try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  // ========================
  // GOOGLE LOGIN
  // ========================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google login failed");

      // Save token and user (same as normal login)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage || "",
        isAdmin: data.isAdmin || false,
      }));

      setSuccess("Welcome! Redirecting...");
      setTimeout(() => {
        navigate("/", { replace: true });
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

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

            {needsVerification && (
              <div style={{
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
                textAlign: "center"
              }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#92400e", fontWeight: "600" }}>
                  Email not verified
                </p>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#92400e" }}>
                  Check your inbox for the verification link, or request a new one.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "#f59e0b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: resendLoading ? "not-allowed" : "pointer",
                    opacity: resendLoading ? 0.7 : 1,
                  }}
                >
                  {resendLoading ? "Sending..." : "Resend Verification Email"}
                </button>
                {resendSuccess && (
                  <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#16a34a", fontWeight: "500" }}>
                    {resendSuccess}
                  </p>
                )}
              </div>
            )}

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
              {HAS_GOOGLE ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="continue_with"
                  shape="rectangular"
                />
              ) : (
                <button type="button" className="social-btn google" title="Sign in with Google">
                  <i className='bx bxl-google'></i>
                </button>
              )}


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
