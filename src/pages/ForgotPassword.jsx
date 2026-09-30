import api from "../api.js";
import '../styles/Login.css';
import Header from '../pages/Header.jsx';
import { Link } from 'react-router-dom';
import { useState } from "react";
import { useToast } from "../components/Toast.jsx";
import Footer from "../components/Footer.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/forgot-password", { email });

      showToast(data.message || "If that email is registered, you'll receive a reset link shortly.", "success", 6000);
      setEmail("");
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
                <i className='bx bxs-lock-open-alt'></i>
              </div>
              <h1>Forgot Password?</h1>
              <p>No worries! Enter your email and we'll send you a link to reset it.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <div className="input-wrapper">
                  <i className='bx bxs-envelope'></i>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="modern-input"
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
                    Sending...
                  </span>
                ) : (
                  <span className="btn-content">
                    Send Reset Link
                    <i className='bx bx-right-arrow-alt'></i>
                  </span>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Remember your password?{" "}
                <Link to="/login" className="switch-link">
                  Back to Login
                </Link>
              </p>
            </div>
          </div>

          <div className="login-decoration">
            <div className="decoration-content">
              <h2>Secure Account Recovery</h2>
              <p>We'll help you get back into your account safely</p>
              <div className="features">
                <div className="feature">
                  <i className='bx bxs-shield-check'></i>
                  <span>Secure Reset Link</span>
                </div>
                <div className="feature">
                  <i className='bx bxs-time'></i>
                  <span>Link Expires in 30 Minutes</span>
                </div>
                <div className="feature">
                  <i className='bx bxs-envelope'></i>
                  <span>Check Your Inbox</span>
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
