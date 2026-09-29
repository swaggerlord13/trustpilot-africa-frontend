import React, { useState, useEffect, useCallback, createContext, useContext } from "react";

// ─── Context so any component can call showToast() ───
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

// ─── Detect dark mode from data-theme attribute ───
function useIsDark() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

// ─── Color palettes for light and dark ───
const lightColors = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", stroke: "#16a34a" },
  error:   { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", stroke: "#dc2626" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", stroke: "#d97706" },
  info:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", stroke: "#2563eb" },
};

const darkColors = {
  success: { bg: "#052e16", border: "#166534", text: "#86efac", stroke: "#4ade80" },
  error:   { bg: "#2a0a0a", border: "#7f1d1d", text: "#fca5a5", stroke: "#f87171" },
  warning: { bg: "#2a1f04", border: "#78350f", text: "#fde68a", stroke: "#fbbf24" },
  info:    { bg: "#0a1628", border: "#1e3a5f", text: "#93c5fd", stroke: "#60a5fa" },
};

// ─── Individual toast item ───
function ToastItem({ toast, onRemove, isDark }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const palette = isDark ? darkColors : lightColors;
  const type = toast.type || "info";
  const c = palette[type] || palette.info;

  const icons = {
    success: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c.stroke} strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c.stroke} strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c.stroke} strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.6 14.93A1 1 0 002.56 20h18.88a1 1 0 00.86-1.21L13.71 3.86a1 1 0 00-1.42 0z" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c.stroke} strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 20px",
        borderRadius: 12,
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.4)"
          : "0 4px 20px rgba(0,0,0,0.08)",
        minWidth: 280,
        maxWidth: 420,
        animation: exiting ? "toastOut 0.3s ease forwards" : "toastIn 0.3s ease forwards",
        cursor: "pointer",
        lineHeight: 1.5,
      }}
      onClick={() => {
        setExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
      }}
    >
      <div style={{ flexShrink: 0 }}>{icons[type]}</div>
      <div style={{ flex: 1 }}>{toast.message}</div>
    </div>
  );
}

// ─── Toast container + provider ───
let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const isDark = useIsDark();

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      {/* Toast stack: fixed top-right */}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} isDark={isDark} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(80px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(80px); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
