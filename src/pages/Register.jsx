import api from "../api.js";
import ButtonSpinner from "../components/ButtonSpinner.jsx";
import Header from "../pages/Header.jsx";
import { Link } from 'react-router-dom';
import '../styles/Register.css';
import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useToast } from "../components/Toast.jsx";
import { useAuth } from "../components/AuthProvider.jsx";

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
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();
  const { login, isLoggedIn } = useAuth();

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
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Already logged in? Send to homepage
  if (isLoggedIn) return <Navigate to="/" replace />;

  // Submit form (normal email/password registration)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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

      const { data } = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        profileImage: formData.profileImage,
      });

      // Save via AuthProvider
      login({
        _id: data._id,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage || "",
        isAdmin: data.isAdmin || false,
      }, data.token);

      // Show verification message
      showToast("Account created! Please check your email to verify your account.", "success", 6000);

      // Redirect to login page (they need to verify first)
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);

    } catch (err) {
      console.error("Register error:", err);
      setError(err.response?.data?.error || err.message || "Registration failed");
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

      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      // Save via AuthProvider
      login({
        _id: data._id,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage || "",
        isAdmin: data.isAdmin || false,
      }, data.token);

      showToast("Account created! Redirecting...", "success");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Google sign up failed. Please try again.");
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

      {error && (
        <div className="mx-auto max-w-md mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <i className='bx bxs-error-circle text-lg'></i>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 dark:hover:text-red-200">
            <i className='bx bx-x text-lg'></i>
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
              <p>Join thousands of users on Trustpilotafrica</p>
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
                    <ButtonSpinner color="border-white" />
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


            </div>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="switch-link">
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
              <h2>Why Join Trustpilotafrica?</h2>
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
                    <h3>Help Others Decide</h3>
                    <p>Your reviews help millions make better choices</p>
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
                  <i className='bx bxs-check-circle' style={{color: '#22c55e', fontSize: '1.5rem'}}></i>
                  <p>Free to join</p>
                </div>
                <div className="stat">
                  <i className='bx bxs-check-circle' style={{color: '#22c55e', fontSize: '1.5rem'}}></i>
                  <p>Real reviews only</p>
                </div>
                <div className="stat">
                  <i className='bx bxs-check-circle' style={{color: '#22c55e', fontSize: '1.5rem'}}></i>
                  <p>100% African focus</p>
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
