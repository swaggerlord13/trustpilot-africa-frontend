import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src="/trustpilotafricalogo.png"
                alt="Trustpilotafrica"
                className="h-8 brightness-0 invert"
              />
            </Link>
            <p className="text-sm leading-relaxed text-slate-500">
              Africa's trusted platform for honest company reviews. Helping
              consumers make informed decisions and businesses build
              credibility.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-white transition-colors">
                  Companies
                </Link>
              </li>
              <li>
                <Link to="/browse-reviews" className="hover:text-white transition-colors">
                  Browse Reviews
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Connect</h3>
            <p className="text-sm mb-5">
              Have questions? Reach out at{" "}
              <a
                href="mailto:hello@trustpilot.africa"
                className="text-brand-200 hover:text-white transition-colors"
              >
                hello@trustpilot.africa
              </a>
            </p>
            <div className="flex gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-brand-600 transition-colors"
                aria-label="Twitter"
              >
                <i className="bx bxl-twitter text-lg"></i>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-brand-600 transition-colors"
                aria-label="Facebook"
              >
                <i className="bx bxl-facebook text-lg"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-coral-500 transition-colors"
                aria-label="Instagram"
              >
                <i className="bx bxl-instagram text-lg"></i>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-brand-500 transition-colors"
                aria-label="LinkedIn"
              >
                <i className="bx bxl-linkedin text-lg"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-12 pt-6 text-center text-sm text-slate-600">
          <p>&copy; {currentYear} Trustpilotafrica. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
