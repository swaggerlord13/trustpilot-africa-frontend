/**
 * Small inline spinner for buttons and inline loading states.
 * Use <Loader /> for full-page/section loading instead.
 */
export default function ButtonSpinner({ size = "w-5 h-5", color = "border-brand-500", className = "" }) {
  return (
    <div
      className={`${size} border-2 ${color} border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}
