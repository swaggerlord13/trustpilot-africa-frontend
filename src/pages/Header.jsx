import { Link, useNavigate } from "react-router-dom";
import Nav from "../components/Nav.jsx";
import "../styles/Header.css";
import { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeProvider.jsx";

export default function Header() {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { resolved, toggle } = useTheme();

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (token && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Invalid user data in localStorage:", err);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, []);

  // Re-check auth when storage changes (e.g. logout from another tab or 401 response)
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (token && storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch (e) { setUser(null); }
      } else {
        setUser(null);
      }
    };
    window.addEventListener("storage", checkAuth);
    // Also listen for custom auth event (fired from within same tab)
    window.addEventListener("auth-change", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="head">
      <div className="Headercontainer">
        <div className="leftsection">
          <img className="logo" src="/trustpilotafricalogo.png" alt="logo" />
        </div>

        {/* Mobile: theme toggle next to hamburger */}
        <div className="mobile-theme-group">
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <i className={resolved === "dark" ? "bx bx-sun" : "bx bx-moon"}></i>
          </button>
        </div>

        <div 
          className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={toggleMobileMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <Nav 
          isOpen={isMobileMenuOpen} 
          onClose={closeMobileMenu}
          user={user}
          onLogout={handleLogout}
        />
        
        <div className="rightsection">
          {/* Desktop: theme toggle in the right section */}
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <i className={resolved === "dark" ? "bx bx-sun" : "bx bx-moon"}></i>
          </button>

          {user ? (
            <>
              <Link to="/profile" onClick={closeMobileMenu} className="profile-link">
                <img
                  className="profileimage"
                  src={user.profileImage || "/default-avatar.svg"}
                  alt="Profile"
                />
                <span>{user.name || "User"}</span>
              </Link>
              {user.isAdmin && (
                <Link to="/admin" className="admin-link" onClick={closeMobileMenu}>
                  <i className="bx bx-shield-quarter"></i>
                  <span>Admin</span>
                </Link>
              )}
              <button className="Loginbutton" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMobileMenu}>
                <button className="Loginbutton">Login</button>
              </Link>
              <Link to="/register" onClick={closeMobileMenu}>
                <button className="Registerbutton">Register</button>
              </Link>
            </>
          )}
        </div>
      </div>
      
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      ></div>
    </div>
  );
}
