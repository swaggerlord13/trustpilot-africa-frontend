// src/components/Loader.jsx
import React from "react";

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      {/* Spinning circle */}
      <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>

      {/* Loading message */}
      <p className="mt-4 text-brand-600 font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default Loader;
