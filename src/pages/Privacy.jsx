import Layout from "../components/Layout.jsx";

export default function Privacy() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-gray max-w-none space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <strong>Last updated:</strong> September 2026
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly: your name, email
            address, and profile image when you register. We also collect
            reviews, ratings, and comments you post on the platform.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            2. How We Use Your Information
          </h2>
          <p>
            We use your information to operate and improve the platform,
            display your reviews alongside your profile name, send account
            notifications (password resets, security alerts), and analyze usage
            patterns to improve user experience.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            3. Information Sharing
          </h2>
          <p>
            Your reviews and profile name are publicly visible on the platform.
            We do not sell your personal information to third parties. We may
            share data with service providers who help us operate the platform
            (hosting, analytics). We may disclose information when required by
            law.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            4. Data Security
          </h2>
          <p>
            We use industry-standard security measures to protect your data,
            including encryption of passwords and secure transmission of data.
            However, no method of transmission over the internet is 100%
            secure.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            5. Your Rights
          </h2>
          <p>
            You can update your profile information at any time through your
            account settings. You can delete your reviews individually. You
            can request deletion of your account by contacting us. You can opt
            out of non-essential communications.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            6. Cookies
          </h2>
          <p>
            We use essential cookies to keep you logged in and remember your
            preferences. We do not use tracking or advertising cookies.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            7. Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. We will
            notify you of significant changes via email or a notice on the
            platform.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-8">
            8. Contact
          </h2>
          <p>
            For privacy-related questions, contact us at{" "}
            <a
              href="mailto:privacy@trustpilot.africa"
              className="text-brand-500 hover:text-brand-600 hover:underline"
            >
              privacy@trustpilot.africa
            </a>
            .
          </p>
        </div>
      </div>
    </Layout>
  );
}
