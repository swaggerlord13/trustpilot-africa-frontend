import Header from "../pages/Header.jsx";
import Footer from "./Footer.jsx";

export default function Layout({ children, hideHeader, hideFooter }) {
  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeader && <Header />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
