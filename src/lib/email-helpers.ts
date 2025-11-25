export function getUserInboundEmail(userId: string): string {
  const domain = process.env.RESEND_INBOUND_DOMAIN || "resend.dev";
  return `save+${userId}@${domain}`;
}

export function getUserInboundMailtoLink(userId: string): string {
  const email = getUserInboundEmail(userId);
  return `mailto:${email}`;
}
