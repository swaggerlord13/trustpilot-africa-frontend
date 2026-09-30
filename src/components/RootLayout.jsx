import { Outlet } from "react-router-dom";
import ScrollToTop from "./ScrollToTop.jsx";

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Outlet />
    </div>
  );
}
