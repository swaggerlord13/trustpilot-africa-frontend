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
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      }
    } catch (err) {
      console.error("Invalid user data in localStorage:", err);
      localStorage.removeItem("user");
    }
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
    setUser(null);
    setIsMobileMenuOpen(false);
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
              <Link to="/profile" onClick={closeMobileMenu}>
                <img
                  className="profileimage"
                  src={user.profileImage || "https://avatar.iran.liara.run/public"}
                  alt="Profile"
                />
              </Link>
              <span>{user.name || "User"}</span>
              <button className="Loginbutton" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/Login" onClick={closeMobileMenu}>
                <button className="Loginbutton">Login</button>
              </Link>
              <Link to="/Register" onClick={closeMobileMenu}>
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
