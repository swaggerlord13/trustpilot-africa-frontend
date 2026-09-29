import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

/**
 * Reads token + user from localStorage safely.
 * Returns { token, user } or { token: null, user: null } on failure.
 */
function readAuthFromStorage() {
  try {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    if (token && raw) {
      const user = JSON.parse(raw);
      return { token, user };
    }
  } catch (err) {
    console.error("Invalid auth data in localStorage:", err);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => readAuthFromStorage());

  // Derived values — no extra state needed
  const user = authState.user;
  const token = authState.token;
  const isLoggedIn = !!token;
  const isAdmin = !!user?.isAdmin;

  /**
   * Call after a successful login/register.
   * Saves to localStorage and updates React state in one shot.
   * No more window.location.reload() needed!
   */
  const login = useCallback((userData, newToken) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setAuthState({ token: newToken, user: userData });
    window.dispatchEvent(new Event("auth-change"));
  }, []);

  /**
   * Clears everything and resets state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthState({ token: null, user: null });
    window.dispatchEvent(new Event("auth-change"));
  }, []);

  /**
   * Updates just the user object (e.g. after profile edit).
   * Keeps the existing token.
   */
  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  }, []);

  // Listen for cross-tab changes (storage event) and same-tab changes (auth-change event)
  useEffect(() => {
    const syncAuth = () => {
      setAuthState(readAuthFromStorage());
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-change", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-change", syncAuth);
    };
  }, []);

  const value = { user, token, isLoggedIn, isAdmin, login, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state anywhere in the app.
 *
 * const { user, token, isLoggedIn, isAdmin, login, logout, updateUser } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
