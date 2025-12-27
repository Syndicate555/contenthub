import { notFound } from "next/navigation";
import DevToolsClient from "./DevToolsClient";

/**
 * Dev Tools Page - Server Component
 * Returns 404 in production to prevent exposure of development utilities
 */
export default function DevToolsPage() {
  // Block access in production
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DevToolsClient />;
}
