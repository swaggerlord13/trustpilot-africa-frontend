import { API_BASE_URL } from "../api.js";
import '../styles/Login.css';
import Header from '../pages/Header.jsx';
import { Link } from 'react-router-dom';
import { useState } from "react";
import Footer from "../components/Footer.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess(data.message || "If that email is registered, you'll receive a reset link shortly.");
      setEmail("");
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
                <Link to="/Login" className="switch-link">
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
