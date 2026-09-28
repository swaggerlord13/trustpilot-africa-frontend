import '../styles/nav.css';
import { NavLink, Link } from 'react-router-dom';

function Nav({ isOpen, onClose, user, onLogout }) {
  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`middlesection ${isOpen ? 'active' : ''}`}>
      <ul>
        <li>
          <NavLink 
            to="/" 
            className={({isActive}) => isActive ? "active": ""}
            onClick={handleLinkClick}
          > 
            Home
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/Categories" 
            className={({isActive}) => isActive ? "active": ""}
            onClick={handleLinkClick}
          >
            Categories
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/companies"
            className={({isActive}) => isActive ? "active": ""}
            onClick={handleLinkClick}
          >
            Companies
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/Browse-Reviews"
            className={({isActive}) => isActive ? "active": ""}
            onClick={handleLinkClick}
          >
            Browse Review
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/About" 
            className={({isActive}) => isActive ? "active": ""}
            onClick={handleLinkClick}
          >
            About Us
          </NavLink>
        </li>
      </ul>

      {/* Mobile Auth/Profile Section */}
      {user ? (
        <div className="mobile-profile-section">
          <div className="profile_info">
          <Link to="/profile" onClick={handleLinkClick}>
            <img
              className="profileimage"
              src={user.profileImage || "https://avatar.iran.liara.run/public"}
              alt="Profile"
            />
          </Link>
          <span className="user-name">{user.name || "User"}</span>
          </div>
          {user.isAdmin && (
            <Link to="/admin" className="admin-link mobile-admin-link" onClick={handleLinkClick}>
              <i className="bx bx-shield-quarter"></i>
              <span>Admin Panel</span>
            </Link>
          )}
          <button className="Loginbutton" onClick={() => { onLogout(); handleLinkClick(); }}>
            Logout
          </button>
        </div>
      ) : (
        <div className="mobile-auth-section">
          <div className="mobile-auth-buttons">
            <Link to="/Login" onClick={handleLinkClick}>
              <button className="Loginbutton">Login</button>
            </Link>
            <Link to="/Register" onClick={handleLinkClick}>
              <button className="Registerbutton">Register</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Nav;