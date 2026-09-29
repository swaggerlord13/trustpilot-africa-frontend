import { API_BASE_URL } from "../api.js";
import Header from "../pages/Header.jsx";
import { Link } from 'react-router-dom';
import '../styles/RegisterBusiness.css';
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer.jsx";

export default function RegisterBusiness() {
  // Step state: we break the form into 2 steps so it doesn't feel overwhelming
  const [step, setStep] = useState(1);

  // Personal info (Step 1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Company info (Step 2)
  const [companyData, setCompanyData] = useState({
    companyName: "",
    companyUrl: "",
    role: "owner",
    jobTitle: "",
    reason: "",
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
  const [searchParams] = useSearchParams();
  const claimCompanyName = searchParams.get("claim");
  const claimCompanyId = searchParams.get("companyId");
  const claimCompanyUrl = searchParams.get("url");

  // If user is already logged in, redirect to homepage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      navigate("/", { replace: true });
    }
  }, []);

  // Pre-fill company details when claiming an existing company
  useEffect(() => {
    if (claimCompanyName) {
      setCompanyData(prev => ({
        ...prev,
        companyName: claimCompanyName,
        companyUrl: claimCompanyUrl || "",
      }));
    }
  }, [claimCompanyName, claimCompanyUrl]);

  // Free email domains that are NOT allowed for business registration
  const blockedDomains = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
    "icloud.com", "mail.com", "protonmail.com", "zoho.com", "yandex.com",
    "live.com", "msn.com", "me.com", "inbox.com", "gmx.com",
    "yahoo.co.uk", "yahoo.co.in", "hotmail.co.uk", "rocketmail.com",
    "rediffmail.com", "fastmail.com", "tutanota.com",
  ];

  const isBusinessEmail = (email) => {
    if (!email || !email.includes("@")) return false;
    const domain = email.split("@")[1]?.toLowerCase();
    return !blockedDomains.includes(domain);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyData({ ...companyData, [name]: value });
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Validate Step 1 before moving to Step 2
  const handleNextStep = () => {
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!isBusinessEmail(formData.email)) {
      setError("Please use your company email address. Free email providers (Gmail, Yahoo, etc.) are not accepted for business registration.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!agreedToTerms) {
      setError("Please agree to the Terms & Conditions");
      return;
    }

    if (!companyData.companyName.trim()) {
      setError("Company name is required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/register-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          companyName: companyData.companyName,
          companyUrl: companyData.companyUrl,
          role: companyData.role,
          jobTitle: companyData.jobTitle,
          reason: companyData.reason,
          ...(claimCompanyId ? { claimCompanyId } : {}),
        }),
      });

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

      // Save auth data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        profileImage: data.profileImage || "",
        isAdmin: data.isAdmin || false,
      }));

      setSuccess(`Account created! Your claim for "${data.businessRegistration?.companyName}" is pending admin review. Please check your email to verify your account.`);
      
      // Redirect to login (they need to verify email first)
      setTimeout(() => {
        navigate("/Login", { replace: true });
      }, 3500);

    } catch (err) {
      console.error("Business register error:", err);
      setError(err.message || "Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
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

      <div className="biz-register-container">
        <div className="biz-register-wrapper">
          {/* Left side: Form */}
          <div className="biz-register-card">
            <div className="biz-register-header">
              <div className="biz-logo-icon">
                <i className='bx bxs-business'></i>
              </div>
              <h1>{claimCompanyName ? "Claim " + claimCompanyName : "Register Your Business"}</h1>
              <p>Claim your company profile and manage your reviews</p>
            </div>

            {/* Step Indicator */}
            <div className="step-indicator">
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>
                <span>1</span>
                <p>Your Info</p>
              </div>
              <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>
                <span>2</span>
                <p>Company</p>
              </div>
            </div>

            {/* ===== STEP 1: Personal Info ===== */}
            {step === 1 && (
              <div className="biz-form-step">
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
                      placeholder='Company Email (e.g. you@yourcompany.com)'
                      value={formData.email}
                      onChange={handleChange}
                      required
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

                  {(passwordFocus || formData.password) && (
                    <div className="password-strength">
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map(level => (
                          <div
                            key={level}
                            className="strength-bar"
                            style={{
                              backgroundColor: passwordStrength >= level ? getPasswordStrengthColor() : '#e5e7eb'
                            }}
                          ></div>
                        ))}
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

                <button
                  type="button"
                  onClick={handleNextStep}
                  className='biz-next-btn'
                >
                  <span className="btn-content">
                    Continue to Company Info
                    <i className='bx bx-right-arrow-alt'></i>
                  </span>
                </button>
              </div>
            )}

            {/* ===== STEP 2: Company Info ===== */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="biz-form-step">
                <div className="form-group">
                  <div className="input-wrapper">
                    <i className='bx bxs-building-house'></i>
                    <input
                      type="text"
                      name="companyName"
                      placeholder='Company Name *'
                      value={companyData.companyName}
                      onChange={handleCompanyChange}
                      required
                      disabled={loading || !!claimCompanyName}
                      readOnly={!!claimCompanyName}
                      className="modern-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-wrapper">
                    <i className='bx bx-globe'></i>
                    <input
                      type="url"
                      name="companyUrl"
                      placeholder='Company Website (optional)'
                      value={companyData.companyUrl}
                      onChange={handleCompanyChange}
                      disabled={loading}
                      className="modern-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="field-label">Your Role</label>
                  <div className="role-selector">
                    {[
                      { value: "owner", label: "Owner", icon: "bxs-crown" },
                      { value: "manager", label: "Manager", icon: "bxs-briefcase" },
                      { value: "representative", label: "Rep", icon: "bxs-user-badge" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`role-chip ${companyData.role === opt.value ? 'selected' : ''}`}
                        onClick={() => setCompanyData({ ...companyData, role: opt.value })}
                        disabled={loading}
                      >
                        <i className={`bx ${opt.icon}`}></i>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-wrapper">
                    <i className='bx bxs-id-card'></i>
                    <input
                      type="text"
                      name="jobTitle"
                      placeholder='Job Title (optional)'
                      value={companyData.jobTitle}
                      onChange={handleCompanyChange}
                      disabled={loading}
                      className="modern-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-wrapper textarea-wrapper">
                    <i className='bx bxs-message-detail'></i>
                    <textarea
                      name="reason"
                      placeholder='Tell us why you want to manage this company page (optional)'
                      value={companyData.reason}
                      onChange={handleCompanyChange}
                      disabled={loading}
                      className="modern-input modern-textarea"
                      rows="3"
                    ></textarea>
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

                <div className="biz-form-actions">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className='biz-back-btn'
                    disabled={loading}
                  >
                    <i className='bx bx-left-arrow-alt'></i>
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !agreedToTerms}
                    className='biz-submit-btn'
                  >
                    {loading ? (
                      <span className="btn-content">
                        <div className="spinner"></div>
                        Creating...
                      </span>
                    ) : (
                      <span className="btn-content">
                        Register Business
                        <i className='bx bx-right-arrow-alt'></i>
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="switch-link">Sign In</Link>
              </p>
              <p style={{ marginTop: '0.5rem' }}>
                Just want to leave reviews?{' '}
                <Link to="/register" className="switch-link">Register as User</Link>
              </p>
            </div>
          </div>

          {/* Right side: Business Benefits */}
          <div className="biz-benefits-panel">
            <div className="biz-benefits-content">
              <h2>Grow Your Business</h2>
              <p className="biz-benefits-subtitle">
                Join businesses across Africa building trust with verified reviews
              </p>

              <div className="biz-benefit-list">
                <div className="biz-benefit-item">
                  <div className="biz-benefit-icon">
                    <i className='bx bxs-dashboard'></i>
                  </div>
                  <div className="biz-benefit-text">
                    <h3>Business Dashboard</h3>
                    <p>Monitor your ratings, track reviews, and see analytics at a glance</p>
                  </div>
                </div>

                <div className="biz-benefit-item">
                  <div className="biz-benefit-icon">
                    <i className='bx bxs-message-dots'></i>
                  </div>
                  <div className="biz-benefit-text">
                    <h3>Respond to Reviews</h3>
                    <p>Reply to customer feedback and show you care about their experience</p>
                  </div>
                </div>

                <div className="biz-benefit-item">
                  <div className="biz-benefit-icon">
                    <i className='bx bxs-edit-alt'></i>
                  </div>
                  <div className="biz-benefit-text">
                    <h3>Manage Your Profile</h3>
                    <p>Keep your company info up to date. Logo, description, and website</p>
                  </div>
                </div>

                <div className="biz-benefit-item">
                  <div className="biz-benefit-icon">
                    <i className='bx bxs-shield-check'></i>
                  </div>
                  <div className="biz-benefit-text">
                    <h3>Build Trust</h3>
                    <p>Verified business badge shows customers you're the real deal</p>
                  </div>
                </div>
              </div>

              <div className="biz-free-badge">
                <i className='bx bxs-gift'></i>
                <div>
                  <h4>Completely Free</h4>
                  <p>No subscription. No hidden fees. Just claim and manage.</p>
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
