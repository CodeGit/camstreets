import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getMagicLinkFor } from "../e2e/helpers/mailpit";
import { requireEnv } from "./support";

export type SignInEmail = { link: string; from: string; subject: string; html: string };

// Finds the sign-in email sent to `to` after `sentAfter`, returns its magic
// link, and deletes it (so the monitor inbox doesn't grow forever).
//
// MAIL_SOURCE=mailpit swaps in the local Mailpit inbox - only so this
// spec's own logic can be exercised against the local stack; production
// runs always use IMAP.
export async function waitForSignInEmail(to: string, sentAfter: Date): Promise<SignInEmail> {
  if (process.env.MAIL_SOURCE === "mailpit") {
    const link = await getMagicLinkFor(to);
    return { link, from: "(mailpit)", subject: "Your sign-in link", html: "expires in 24 hours" };
  }

  const client = new ImapFlow({
    host: requireEnv("IMAP_HOST"),
    port: 993,
    secure: true,
    auth: { user: requireEnv("IMAP_USER"), pass: requireEnv("IMAP_PASSWORD") },
    logger: false,
  });
  await client.connect();
  try {
    // Checked in this order every pass: Spam is only here so a miss says
    // *why* (see below), not to treat Spam as an acceptable destination -
    // a volunteer's real sign-in email landing in Spam looks exactly like
    // "login is broken" from where they sit, so this must stay loud, not
    // silently swallowed into a pass.
    const mailboxes = ["INBOX", "[Gmail]/Spam"];
    // 5 minutes, not 120s: confirmed 2026-10-02 that sign-in emails do
    // arrive in the Inbox (not Spam), just sometimes well after 120s -
    // dozens of unread, never-collected emails had piled up from runs that
    // gave up too early and disconnected before delivery caught up. If this
    // window is still being used up regularly, that's itself worth raising
    // with SMTP2GO - a real volunteer waiting 5 minutes for a sign-in link
    // would reasonably think the site is broken.
    const deadline = Date.now() + 300_000;
    while (Date.now() < deadline) {
      for (const mailbox of mailboxes) {
        let lock;
        try {
          lock = await client.getMailboxLock(mailbox);
        } catch {
          continue; // e.g. a non-Gmail inbox with no Spam folder by that name
        }
        try {
          // IMAP's SINCE is date-only, so narrow by day here and by exact
          // timestamp below.
          const uids = await client.search({ since: sentAfter, to }, { uid: true });
          for (const uid of (uids || []).reverse()) {
            const msg = await client.fetchOne(String(uid), { source: true, internalDate: true }, { uid: true });
            if (!msg || !msg.source || !msg.internalDate) continue;
            if (new Date(msg.internalDate).getTime() < sentAfter.getTime() - 5_000) continue;
            const parsed = await simpleParser(msg.source);
            const html = typeof parsed.html === "string" ? parsed.html : "";
            const href = html.match(/href="([^"]+)"/)?.[1];
            if (!href) continue;
            await client.messageDelete(String(uid), { uid: true });
            if (mailbox !== "INBOX") {
              throw new Error(
                `Sign-in email for ${to} arrived in ${mailbox}, not Inbox - a deliverability problem (check SMTP2GO's sending log and Gmail's filters), not a flaky test`
              );
            }
            return {
              link: href.replace(/&amp;/g, "&"),
              from: parsed.from?.text ?? "",
              subject: parsed.subject ?? "",
              html,
            };
          }
        } finally {
          lock.release();
        }
      }
      await new Promise((r) => setTimeout(r, 5_000));
    }
    throw new Error(`No sign-in email for ${to} arrived in Inbox or Spam within 120s`);
  } finally {
    await client.logout();
  }
}
