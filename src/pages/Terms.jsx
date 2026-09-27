import Layout from "../components/Layout.jsx";

export default function Terms() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-gray max-w-none space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <strong>Last updated:</strong> September 2026
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using TrustPilot Africa, you agree to be bound by
            these Terms of Service. If you do not agree to these terms, please
            do not use our platform.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            2. User Accounts
          </h2>
          <p>
            When you create an account, you must provide accurate and complete
            information. You are responsible for maintaining the security of
            your account and password. You must notify us immediately of any
            unauthorized access.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            3. Reviews and Content
          </h2>
          <p>
            All reviews must be based on genuine experiences with the company
            being reviewed. Reviews must not contain defamatory, abusive,
            hateful, or discriminatory content. We reserve the right to remove
            reviews that violate these guidelines. You retain ownership of your
            reviews but grant us a non-exclusive license to display them on our
            platform.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            4. Prohibited Conduct
          </h2>
          <p>
            Users must not post fake or misleading reviews, harass or
            impersonate other users, attempt to manipulate ratings or reviews,
            use automated tools to scrape or collect data, or violate any
            applicable laws.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            5. Company Listings
          </h2>
          <p>
            Companies may be added by users or our team. We do not guarantee
            the accuracy of company information and encourage companies to
            claim and update their own listings.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            6. Limitation of Liability
          </h2>
          <p>
            TrustPilot Africa provides the platform as-is. We are not
            responsible for the accuracy of user-generated reviews or company
            information. We do not endorse any company listed on our platform.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            7. Changes to Terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of the
            platform after changes constitutes acceptance of the new terms.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            8. Contact
          </h2>
          <p>
            If you have questions about these terms, please contact us at{" "}
            <a
              href="mailto:hello@trustpilot.africa"
              className="text-brand-500 hover:text-brand-600 hover:underline"
            >
              hello@trustpilot.africa
            </a>
            .
          </p>
        </div>
      </div>
    </Layout>
  );
}
