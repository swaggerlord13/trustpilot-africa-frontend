import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }) {
  // "system" = follow device, "light" = forced light, "dark" = forced dark
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("tp-theme") || "system";
    } catch {
      return "system";
    }
  });

  const [resolved, setResolved] = useState("light");

  // Resolve actual theme from mode + system preference
  useEffect(() => {
    function resolve() {
      if (mode === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setResolved(prefersDark ? "dark" : "light");
      } else {
        setResolved(mode);
      }
    }
    resolve();

    // Listen for system preference changes when in "system" mode
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (mode === "system") resolve(); };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  // Apply data-theme attribute to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  // Persist mode choice
  useEffect(() => {
    try { localStorage.setItem("tp-theme", mode); } catch {}
  }, [mode]);

  const toggle = () => {
    // Cycle: if currently light → dark, if dark → light
    // (keeps mode as explicit override once toggled)
    setMode(resolved === "light" ? "dark" : "light");
  };

  const setSystem = () => setMode("system");

  return (
    <ThemeContext.Provider value={{ mode, resolved, toggle, setSystem, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
