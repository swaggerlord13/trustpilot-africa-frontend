import { Outlet } from "react-router-dom";
import ScrollToTop from "./ScrollToTop.jsx";

export default function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}
