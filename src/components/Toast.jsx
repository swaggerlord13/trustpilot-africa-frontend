import React, { useState, useEffect, useCallback, createContext, useContext } from "react";

// ─── Context so any component can call showToast() ───
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

// ─── Individual toast item ───
function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons = {
    success: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.6 14.93A1 1 0 002.56 20h18.88a1 1 0 00.86-1.21L13.71 3.86a1 1 0 00-1.42 0z" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const bgColors = {
    success: "#f0fdf4",
    error: "#fef2f2",
    warning: "#fffbeb",
    info: "#eff6ff",
  };

  const borderColors = {
    success: "#bbf7d0",
    error: "#fecaca",
    warning: "#fde68a",
    info: "#bfdbfe",
  };

  const textColors = {
    success: "#15803d",
    error: "#b91c1c",
    warning: "#92400e",
    info: "#1d4ed8",
  };

  const type = toast.type || "info";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 20px",
        borderRadius: 12,
        backgroundColor: bgColors[type],
        border: `1px solid ${borderColors[type]}`,
        color: textColors[type],
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
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

      {/* Toast stack — fixed top-right */}
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
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
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
