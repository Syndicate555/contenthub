import AddPageClient from "./AddPageClient";
import { getCurrentUser } from "@/lib/auth";
import { getUserInboundEmail } from "@/lib/email-helpers";
import { redirect } from "next/navigation";

export default async function AddPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Generate inbound email on server where env vars are accessible
  const inboundEmail = getUserInboundEmail(user.id);

  return <AddPageClient userId={user.id} inboundEmail={inboundEmail} />;
}
