import { API_BASE_URL } from "../config.js";
import '../styles/Login.css';
import Header from '../pages/Header.jsx';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState } from "react";
import Footer from "../components/Footer.jsx";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Reset failed. The link may have expired.");
      }

      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/Login", { replace: true });
      }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

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
                <i className='bx bxs-key'></i>
              </div>
              <h1>Reset Password</h1>
              <p>Enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <div className="input-wrapper">
                  <i className='bx bxs-lock-alt'></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="modern-input with-toggle"
                    minLength={6}
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

              <div className="form-group">
                <div className="input-wrapper">
                  <i className='bx bxs-lock'></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="modern-input"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="modern-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-content">
                    <div className="spinner"></div>
                    Resetting...
                  </span>
                ) : (
                  <span className="btn-content">
                    Reset Password
                    <i className='bx bx-right-arrow-alt'></i>
                  </span>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Back to{" "}
                <Link to="/Login" className="switch-link">
                  Login
                </Link>
              </p>
            </div>
          </div>

          <div className="login-decoration">
            <div className="decoration-content">
              <h2>Almost There!</h2>
              <p>Choose a strong password to keep your account secure</p>
              <div className="features">
                <div className="feature">
                  <i className='bx bxs-shield-check'></i>
                  <span>At Least 6 Characters</span>
                </div>
                <div className="feature">
                  <i className='bx bxs-lock-alt'></i>
                  <span>Mix Letters & Numbers</span>
                </div>
                <div className="feature">
                  <i className='bx bxs-star'></i>
                  <span>Keep It Unique</span>
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
