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
  const linkMatch: RegExpMatchArray | null = message.Text.match(
    /\(\s*(http\S+?)\s*\)/
  );

  if (!linkMatch) {
    throw new Error("Could not find magic link in email body");
  }

  return linkMatch[1];
}
