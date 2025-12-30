import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy - Tavlo",
  description: "Privacy policy for Tavlo web app and browser extension",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="text-text-secondary hover:text-brand-1 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-text-primary">
            Privacy Policy
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-sm max-w-none">
          <p className="text-sm text-text-secondary mb-8">
            <strong>Last Updated:</strong> December 29, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Overview
            </h2>
            <p className="text-text-body">
              Tavlo ("we", "our", or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, and
              safeguard your information when you use our web application and
              browser extension.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-text-primary mb-3">
              1. Account Information
            </h3>
            <p className="text-text-body mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-text-body mb-4">
              <li>Email address</li>
              <li>Name (optional)</li>
              <li>Authentication credentials (managed by Clerk)</li>
            </ul>

            <h3 className="text-xl font-semibold text-text-primary mb-3">
              2. Saved Content
            </h3>
            <p className="text-text-body mb-4">
              When you save links, we store:
            </p>
            <ul className="list-disc pl-6 text-text-body mb-4">
              <li>URLs you save</li>
              <li>Optional notes you add</li>
              <li>
                Metadata extracted from saved links (title, description, images)
              </li>
              <li>Platform information (Twitter, Reddit, etc.)</li>
              <li>Timestamps</li>
            </ul>

            <h3 className="text-xl font-semibold text-text-primary mb-3">
              3. Browser Extension Data
            </h3>
            <p className="text-text-body mb-4">
              Our Chrome extension accesses:
            </p>
            <ul className="list-disc pl-6 text-text-body mb-4">
              <li>
                <strong>Active Tab URL:</strong> To save the current page you're
                viewing
              </li>
              <li>
                <strong>Authentication Token:</strong> Stored locally in Chrome
                sync storage to keep you logged in
              </li>
              <li>
                <strong>Page Metadata:</strong> To extract titles and platform
                information
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-text-primary mb-3">
              4. Usage Data
            </h3>
            <p className="text-text-body mb-4">We automatically collect:</p>
            <ul className="list-disc pl-6 text-text-body mb-4">
              <li>IP address (for rate limiting and security)</li>
              <li>Browser type and version</li>
              <li>Usage patterns (features used, frequency)</li>
              <li>Error logs (for debugging)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              How We Use Your Information
            </h2>
            <p className="text-text-body mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-text-body">
              <li>Provide and maintain the Tavlo service</li>
              <li>Save and organize your content</li>
              <li>Extract metadata from saved links</li>
              <li>Track reading habits and generate statistics</li>
              <li>Award achievement badges</li>
              <li>Prevent abuse and enforce rate limits</li>
              <li>Improve our service and fix bugs</li>
              <li>Communicate important updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Data Storage and Security
            </h2>

            <h3 className="text-xl font-semibold text-text-primary mb-3">
              Encryption
            </h3>
            <p className="text-text-body mb-4">
              All data is transmitted over HTTPS and stored securely using
              industry-standard encryption.
            </p>

            <h3 className="text-xl font-semibold text-text-primary mb-3">
              Authentication
            </h3>
            <p className="text-text-body mb-4">
              We use{" "}
              <a
                href="https://clerk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-1 hover:underline"
              >
                Clerk
              </a>{" "}
              for authentication, which provides enterprise-grade security and
              compliance (SOC 2 Type II, GDPR, CCPA).
            </p>

            <h3 className="text-xl font-semibold text-text-primary mb-3">
              Data Retention
            </h3>
            <p className="text-text-body mb-4">
              We retain your data as long as your account is active. You can
              delete your account and all associated data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Browser Extension Permissions
            </h2>
            <p className="text-text-body mb-4">
              Our Chrome extension requests the following permissions:
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-text-primary mb-2">
                activeTab
              </h4>
              <p className="text-sm text-text-body">
                <strong>Why we need it:</strong> To read the URL and title of
                the page you want to save.
              </p>
              <p className="text-sm text-text-body">
                <strong>What we access:</strong> Only the current tab's URL and
                metadata when you click "Save to Tavlo".
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-text-primary mb-2">
                contextMenus
              </h4>
              <p className="text-sm text-text-body">
                <strong>Why we need it:</strong> To add "Save to Tavlo" to your
                right-click menu.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-text-primary mb-2">storage</h4>
              <p className="text-sm text-text-body">
                <strong>Why we need it:</strong> To store your authentication
                token locally so you stay logged in.
              </p>
              <p className="text-sm text-text-body">
                <strong>What we store:</strong> Only your session token
                (encrypted by Chrome).
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-text-primary mb-2">
                scripting
              </h4>
              <p className="text-sm text-text-body">
                <strong>Why we need it:</strong> To extract accurate URLs from
                Single Page Applications (Twitter, TikTok, etc.).
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-text-primary mb-2">
                notifications
              </h4>
              <p className="text-sm text-text-body">
                <strong>Why we need it:</strong> To notify you when links are
                saved successfully or if errors occur.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Third-Party Services
            </h2>
            <p className="text-text-body mb-4">
              We use the following services:
            </p>
            <ul className="list-disc pl-6 text-text-body">
              <li>
                <strong>Clerk:</strong> Authentication and user management
              </li>
              <li>
                <strong>Vercel:</strong> Hosting and infrastructure
              </li>
              <li>
                <strong>Upstash:</strong> Redis caching and rate limiting
              </li>
            </ul>
            <p className="text-text-body mt-4">
              These services have their own privacy policies and handle data
              according to industry standards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Data Sharing
            </h2>
            <p className="text-text-body mb-4">
              <strong>We do NOT sell your data.</strong>
            </p>
            <p className="text-text-body mb-4">
              We may share your information only in these cases:
            </p>
            <ul className="list-disc pl-6 text-text-body">
              <li>With your explicit consent</li>
              <li>
                To comply with legal obligations (court orders, subpoenas)
              </li>
              <li>To protect our rights and prevent fraud</li>
              <li>
                With service providers who help operate our service (under
                strict confidentiality agreements)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Your Rights
            </h2>
            <p className="text-text-body mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-text-body">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and all data</li>
              <li>Export your saved links</li>
              <li>Opt out of non-essential emails</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Children's Privacy
            </h2>
            <p className="text-text-body">
              Tavlo is not intended for users under 13 years of age. We do not
              knowingly collect information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Changes to This Policy
            </h2>
            <p className="text-text-body">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the "Last Updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Contact Us
            </h2>
            <p className="text-text-body mb-4">
              If you have questions about this Privacy Policy, please contact
              us:
            </p>
            <ul className="list-none text-text-body">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:privacy@tavlo.ca"
                  className="text-brand-1 hover:underline"
                >
                  privacy@tavlo.ca
                </a>
              </li>
            </ul>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Tavlo
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
