import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthBridge } from "./AuthBridge";

export const metadata = {
  title: "Extension Authentication - Tavlo",
  description: "Authenticate your Tavlo Chrome extension",
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
  // Use custom JWT template "extension" with long expiration (30 days)
  // This template must be configured in Clerk Dashboard -> JWT Templates
  const { getToken } = await auth();
  const token = await getToken({
    template: "extension", // Custom template with 30-day expiration
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Getting Token
          </h1>
          <p className="text-gray-600 mb-6 font-medium">
            Unable to generate authentication token. Please try signing out and
            signing in again.
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:shadow-lg">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Render the AuthBridge component that handles automatic token transfer
  return <AuthBridge token={token} email={email} />;
}
