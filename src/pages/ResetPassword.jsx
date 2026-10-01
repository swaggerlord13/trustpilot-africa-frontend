import api from "../api.js";
import ButtonSpinner from "../components/ButtonSpinner.jsx";
import '../styles/Login.css';
import Header from '../pages/Header.jsx';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState } from "react";
import { useToast } from "../components/Toast.jsx";
import Footer from "../components/Footer.jsx";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.put(`/auth/reset-password/${token}`, { password });

      showToast("Password reset successful! Redirecting to login...", "success");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Something went wrong");
    } finally {
      setLoading(false);
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
                    minLength={8}
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
                    minLength={8}
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
                    <ButtonSpinner color="border-white" />
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
                <Link to="/login" className="switch-link">
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
