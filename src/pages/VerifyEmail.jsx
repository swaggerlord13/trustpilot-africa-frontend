import api from "../api.js";
import '../styles/Login.css';
import Header from '../pages/Header.jsx';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import Footer from "../components/Footer.jsx";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);

        setStatus("success");
        setMessage(data.message || "Email verified successfully!");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/Login", { replace: true });
        }, 3000);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.error || err.message || "Verification failed.");
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <>
      <Header />

      <div className="modern-login-container">
        <div className="login-wrapper">
          <div className="login-card">
            <div className="login-header">
              {status === "verifying" && (
                <>
                  <div className="logo-icon">
                    <i className='bx bx-loader-alt bx-spin' style={{ fontSize: "28px" }}></i>
                  </div>
                  <h1>Verifying Your Email</h1>
                  <p>Please wait while we confirm your email address...</p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="logo-icon" style={{ backgroundColor: "#dcfce7" }}>
                    <i className='bx bxs-check-circle' style={{ color: "#16a34a" }}></i>
                  </div>
                  <h1>Email Verified!</h1>
                  <p>{message}</p>
                  <p style={{ marginTop: "12px", fontSize: "14px", color: "#6b7280" }}>
                    Redirecting you to login...
                  </p>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="logo-icon" style={{ backgroundColor: "#fee2e2" }}>
                    <i className='bx bxs-error-circle' style={{ color: "#dc2626" }}></i>
                  </div>
                  <h1>Verification Failed</h1>
                  <p style={{ color: "#dc2626" }}>{message}</p>
                  <p style={{ marginTop: "12px", fontSize: "14px", color: "#6b7280" }}>
                    The link may have expired. You can request a new one from the login page.
                  </p>
                </>
              )}
            </div>

            <div className="auth-footer" style={{ marginTop: "24px" }}>
              <p>
                <Link to="/login" className="switch-link">
                  Go to Login
                </Link>
              </p>
            </div>
          </div>

          <div className="login-decoration">
            <div className="decoration-content">
              <h2>Almost There!</h2>
              <p>Verifying your email keeps your account secure</p>
              <div className="features">
                <div className="feature">
                  <i className='bx bxs-shield-check'></i>
                  <span>Account Protection</span>
                </div>
                <div className="feature">
                  <i className='bx bxs-envelope'></i>
                  <span>Verified Identity</span>
                </div>
                <div className="feature">
                  <i className='bx bxs-check-circle'></i>
                  <span>Full Access</span>
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
