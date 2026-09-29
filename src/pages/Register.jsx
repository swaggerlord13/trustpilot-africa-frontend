import { API_BASE_URL } from "../api.js";
import Header from "../pages/Header.jsx";
import { Link } from 'react-router-dom';
import '../styles/Register.css';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const HAS_GOOGLE = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
import Footer from "../components/Footer.jsx";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileImage: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Update password strength when password changes
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Auto-hide notifications
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Submit form (normal email/password registration)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!agreedToTerms) {
      setError("Please agree to the Terms & Conditions");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          profileImage: formData.profileImage,
        }),
      });

      // Safely parse response: handle non-JSON responses (e.g. rate limiter HTML)
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error. Please try again later.");
      }

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Save token + user info to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage || "",
        isAdmin: data.isAdmin || false,
      }));

      // Show success message
      setSuccess("Welcome aboard! Redirecting...");

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/", { replace: true });
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error("Register error:", err);
      setError(err.message || "Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // GOOGLE SIGN UP
  // ========================
  // Uses GoogleLogin component from @react-oauth/google
  // It renders Google's own button and handles the popup.
  // When user picks their Google account, we get a credential (JWT ID token)
  // and send it to our backend to verify + create/find the user.
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
      if (!res.ok) throw new Error(data.error || "Google sign up failed");

      // Save token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage || "",
        isAdmin: data.isAdmin || false,
      }));

      setSuccess("Account created! Redirecting...");
      setTimeout(() => {
        navigate("/", { replace: true });
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message || "Google sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign up failed. Please try again.");
  };

  const getPasswordStrengthColor = () => {
    switch(passwordStrength) {
      case 1: return '#ef4444';
      case 2: return '#f59e0b';
      case 3: return '#10b981';
      case 4: return '#059669';
      default: return '#e5e7eb';
    }
  };

  const getPasswordStrengthText = () => {
    switch(passwordStrength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
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
            <h4>Oops!</h4>
            <p>{error}</p>
          </div>
          <button className="toast-close" onClick={() => setError("")}>
            <i className='bx bx-x'></i>
          </button>
        </div>
      )}

      <div className="modern-register-container">
        <div className="register-wrapper">
          {/* Left side - Registration Form */}
          <div className="register-card">
            <div className="register-header">
              <div className="logo-icon">
                <i className='bx bxs-user-plus'></i>
              </div>
              <h1>Create Account</h1>
              <p>Join thousands of users on TrustPilot Africa</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <div className="input-wrapper">
                  <i className='bx bxs-user'></i>
                  <input
                    type="text"
                    name="name"
                    placeholder='Full Name'
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="modern-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-wrapper">
                  <i className='bx bxs-envelope'></i>
                  <input
                    type="email"
                    name="email"
                    placeholder='Email Address'
                    value={formData.email}
                    onChange={handleChange}
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
                    name="password"
                    placeholder='Password'
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
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

                {/* Password Strength Indicator */}
                {(passwordFocus || formData.password) && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      <div
                        className="strength-bar"
                        style={{
                          backgroundColor: passwordStrength >= 1 ? getPasswordStrengthColor() : '#e5e7eb'
                        }}
                      ></div>
                      <div
                        className="strength-bar"
                        style={{
                          backgroundColor: passwordStrength >= 2 ? getPasswordStrengthColor() : '#e5e7eb'
                        }}
                      ></div>
                      <div
                        className="strength-bar"
                        style={{
                          backgroundColor: passwordStrength >= 3 ? getPasswordStrengthColor() : '#e5e7eb'
                        }}
                      ></div>
                      <div
                        className="strength-bar"
                        style={{
                          backgroundColor: passwordStrength >= 4 ? getPasswordStrengthColor() : '#e5e7eb'
                        }}
                      ></div>
                    </div>
                    <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="input-wrapper">
                  <i className='bx bxs-lock'></i>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder='Confirm Password'
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="modern-input with-toggle"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    <i className={showConfirmPassword ? 'bx bxs-hide' : 'bx bxs-show'}></i>
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="terms-checkbox">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                  />
                  <span className="checkmark"></span>
                  <span>
                    I agree to the <Link to="/terms" className="terms-link">Terms & Conditions</Link> and <Link to="/privacy" className="terms-link">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className='modern-submit-btn'
              >
                {loading ? (
                  <span className="btn-content">
                    <div className="spinner"></div>
                    Creating Account...
                  </span>
                ) : (
                  <span className="btn-content">
                    Create Account
                    <i className='bx bx-right-arrow-alt'></i>
                  </span>
                )}
              </button>
            </form>

            <div className="divider">
              <span>Or sign up with</span>
            </div>

            <div className="social-login-buttons">
              {HAS_GOOGLE ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signup_with"
                  shape="rectangular"
                />
              ) : (
                <button type="button" className="social-btn google" title="Sign up with Google">
                  <i className='bx bxl-google'></i>
                </button>
              )}
              <button type="button" className="social-btn facebook" title="Sign up with Facebook">
                <i className='bx bxl-facebook'></i>
              </button>
              <button type="button" className="social-btn apple" title="Sign up with Apple">
                <i className='bx bxl-apple'></i>
              </button>
            </div>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/Login" className="switch-link">
                  Sign In
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

          {/* Right side - Benefits */}
          <div className="register-benefits">
            <div className="benefits-content">
              <h2>Why Join TrustPilot Africa?</h2>
              <div className="benefit-list">
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className='bx bxs-badge-check'></i>
                  </div>
                  <div className="benefit-text">
                    <h3>Verified Reviews</h3>
                    <p>All reviews are verified to ensure authenticity</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className='bx bxs-group'></i>
                  </div>
                  <div className="benefit-text">
                    <h3>Growing Community</h3>
                    <p>Join thousands of users sharing their experiences</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className='bx bxs-trophy'></i>
                  </div>
                  <div className="benefit-text">
                    <h3>Earn Rewards</h3>
                    <p>Get points for every review you write</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <i className='bx bxs-shield-check'></i>
                  </div>
                  <div className="benefit-text">
                    <h3>Safe & Secure</h3>
                    <p>Your data is protected with enterprise-grade security</p>
                  </div>
                </div>
              </div>

              <div className="stats-section">
                <div className="stat">
                  <h4>50K+</h4>
                  <p>Active Users</p>
                </div>
                <div className="stat">
                  <h4>10K+</h4>
                  <p>Companies</p>
                </div>
                <div className="stat">
                  <h4>100K+</h4>
                  <p>Reviews</p>
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
