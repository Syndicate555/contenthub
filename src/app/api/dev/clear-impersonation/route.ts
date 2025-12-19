import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * DEV ONLY: Clear demo impersonation cookie
 * Utility endpoint to quickly exit impersonation mode
 */
export async function POST() {
  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment) {
    return NextResponse.json(
      { ok: false, error: "Only available in development" },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.delete("demo_impersonation_token");

  return NextResponse.json({
    ok: true,
    message: "Impersonation cleared. Refresh to see your own content.",
  });
}

export async function GET() {
  return POST();
}
