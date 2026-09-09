// Polls the local Mailpit inbox for an email to a given address and extracts
// the magic-link URL from it, so tests can drive the real sign-in flow
// without needing a real mailbox.
const MAILPIT_URL = "http://127.0.0.1:54324";

export async function getMagicLinkFor(email: string): Promise<string> {
  let messageId: string | undefined;

  for (let attempt = 0; attempt < 20 && !messageId; attempt++) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data = await res.json();
    const match = data.messages.find(
      (m: { To: { Address: string }[] }) => m.To[0]?.Address === email
    );
    if (match) {
      messageId = match.ID;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (!messageId) {
    throw new Error(`No email found for ${email} in Mailpit`);
  }

  const messageRes = await fetch(`${MAILPIT_URL}/api/v1/message/${messageId}`);
  const message = await messageRes.json();
  // Reads the real href out of the rendered HTML rather than pattern-matching
  // the plain-text body, so this doesn't depend on the email template's
  // wording (e.g. a link being parenthesised) — see supabase/templates/magic_link.html.
  const linkMatch: RegExpMatchArray | null = message.HTML.match(
    /href="([^"]+)"/
  );

  if (!linkMatch) {
    throw new Error("Could not find magic link in email body");
  }

  return linkMatch[1].replace(/&amp;/g, "&");
}
