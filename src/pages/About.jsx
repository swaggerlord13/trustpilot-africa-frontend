import Layout from "../components/Layout.jsx";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            About TrustPilot Africa
          </h1>
          <p className="text-lg md:text-xl text-brand-100 max-w-2xl mx-auto">
            We're building Africa's most trusted review platform, a place where
            honest customer experiences drive better business.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Our Mission
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              In many African markets, there's no reliable way to know whether a
              company delivers on its promises before you hand over your money.
              TrustPilot Africa exists to change that.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              We give everyday consumers a voice and give businesses a reason
              to earn trust, not just attention. Every review on this platform is
              tied to a real user account, making it harder to fake and easier to
              trust.
            </p>
          </div>
          <div className="rounded-2xl p-8 text-center bg-brand-50 dark:bg-slate-800">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Built for Africa
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              We understand the unique challenges of doing business across the
              continent, from Lagos to Nairobi, Accra to Johannesburg.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm text-center border border-slate-100 dark:border-slate-700">
              <div className="w-14 h-14 bg-brand-50 dark:bg-brand-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="bx bx-search text-2xl text-brand-500"></i>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Search Companies
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Find any company by name or browse by category. If it's not
                listed, you can add it yourself.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm text-center border border-slate-100 dark:border-slate-700">
              <div className="w-14 h-14 bg-coral-50 dark:bg-coral-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="bx bx-edit text-2xl text-coral-500"></i>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Write a Review
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Share your real experience. Rate 1 to 5 stars and tell others
                what happened. One review per company, so every opinion counts.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-7 shadow-sm text-center border border-slate-100 dark:border-slate-700">
              <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="bx bx-bar-chart-alt-2 text-2xl text-green-500"></i>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                See the Ratings
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Company ratings are calculated from all user reviews. The more
                reviews, the more accurate the picture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-12">
          What We Stand For
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { icon: "bx bxs-check-shield", title: "Transparency", desc: "Every review is public and tied to a verified user account." },
            { icon: "bx bxs-badge-check", title: "Fairness", desc: "Both positive and negative reviews are shown. No pay-to-play." },
            { icon: "bx bxs-group", title: "Community", desc: "Built by consumers, for consumers. Your experience helps others." },
            { icon: "bx bxs-rocket", title: "Growth", desc: "We help honest businesses stand out and attract the customers they deserve." },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-800 flex items-center justify-center flex-shrink-0">
                <i className={`${item.icon} text-xl text-brand-500`}></i>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-800 text-white py-14 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">
          {localStorage.getItem("token") ? "Make your voice heard" : "Ready to share your voice?"}
        </h2>
        <p className="text-brand-100 mb-8 max-w-lg mx-auto">
          {localStorage.getItem("token")
            ? "Your honest reviews help fellow Africans make smarter choices every day."
            : "Join thousands of Africans who are helping each other make smarter choices."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!localStorage.getItem("token") && (
            <Link
              to="/register"
              className="px-8 py-3 bg-coral-500 text-white rounded-xl font-semibold hover:bg-coral-600 transition-colors"
            >
              Create Free Account
            </Link>
          )}
          {localStorage.getItem("token") && (
            <Link
              to="/categories"
              className="px-8 py-3 bg-coral-500 text-white rounded-xl font-semibold hover:bg-coral-600 transition-colors"
            >
              Write a Review
            </Link>
          )}
          <Link
            to={localStorage.getItem("token") ? "/browse-reviews" : "/companies"}
            className="px-8 py-3 border-2 border-white/40 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
          >
            {localStorage.getItem("token") ? "Browse Reviews" : "Browse Companies"}
          </Link>
        </div>
      </section>
    </Layout>
  );
}
