import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyTokenButton } from "./CopyTokenButton";

export const metadata = {
  title: "Extension Authentication - Tavlo",
  description: "Get your authentication token for the Tavlo Chrome extension",
};

export default async function ExtensionAuthPage() {
  // Check if user is authenticated
  const { userId } = await auth();

  if (!userId) {
    // Redirect to sign-in if not authenticated
    redirect("/sign-in?redirect_url=/extension-auth");
  }

  // Get Clerk user for email display
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "your account";

  // Get session token for extension
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Getting Token
          </h1>
          <p className="text-text-body mb-6">
            Unable to generate authentication token. Please try signing out and
            signing in again.
          </p>
          <Link href="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/today"
            className="text-text-secondary hover:text-brand-1 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-text-primary">
            Extension Authentication
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-text-primary mb-2">
            Authentication Token Ready
          </h2>
          <p className="text-center text-text-secondary mb-8">
            Logged in as <span className="font-medium">{email}</span>
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-brand-1 text-white rounded-full flex items-center justify-center text-sm">
                1
              </span>
              Copy Your Token
            </h3>
            <p className="text-sm text-text-body mb-4">
              Click the button below to copy your authentication token to the
              clipboard.
            </p>

            {/* Token Display */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <code className="text-xs text-text-secondary break-all font-mono block">
                {token}
              </code>
            </div>

            {/* Copy Button */}
            <CopyTokenButton token={token} />
          </div>

          {/* Step 2 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-brand-2 text-white rounded-full flex items-center justify-center text-sm">
                2
              </span>
              Open Tavlo Extension
            </h3>
            <p className="text-sm text-text-body">
              Click the Tavlo extension icon in your Chrome toolbar to open the
              extension popup.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">
                3
              </span>
              Paste Token
            </h3>
            <p className="text-sm text-text-body">
              Paste the token into the extension&apos;s login screen and click
              &quot;Validate &amp; Save&quot;.
            </p>
          </div>

          {/* Security Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-yellow-800">
              <strong>Security Note:</strong> Keep this token private. It
              provides access to your Tavlo account. If compromised, sign out
              and sign back in to generate a new token.
            </p>
          </div>

          {/* Back Button */}
          <div className="flex justify-center">
            <Link href="/today">
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
