import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <h1 className="text-8xl font-extrabold text-brand-500 mb-2">404</h1>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-slate-500 mb-8">
            The page you're looking for doesn't exist or may have been moved.
            Let's get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold"
            >
              Go Home
            </Link>
            <Link
              to="/categories"
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
