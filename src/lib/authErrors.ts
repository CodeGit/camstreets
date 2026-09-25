// Turns the errors Supabase Auth returns into (a) a short key the login page
// has a specific message for, and (b) the raw error code, shown on the page
// as a reference so a failure can be quoted when asking for help. Before
// this, every failure collapsed into one of two vague messages.

type AuthErrorLike = { name?: string; code?: string; status?: number; message?: string };

export type LoginProblem = { key: string; ref: string };

// Failures when asking for a sign-in email (signInWithOtp).
export function classifySendError(error: AuthErrorLike): LoginProblem {
  const ref = error.code ?? error.name ?? (error.status ? `http_${error.status}` : "unknown");

  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit" || error.status === 429) {
    return { key: "rate-limited", ref };
  }
  if (error.code === "validation_failed" || error.code === "email_address_invalid") {
    return { key: "invalid-email", ref };
  }
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return { key: "service-unreachable", ref };
  }
  if (error.code === "unexpected_failure" || error.code === "email_address_not_authorized" || (error.status ?? 0) >= 500) {
    return { key: "email-send-failed", ref };
  }
  return { key: "send-failed", ref };
}

// Failures when using the emailed link, either reported by Supabase in the
// callback's query string (providerErrorCode - its own check of the link
// failed) or by exchanging the link's code for a session.
export function classifyLinkError(input: {
  providerErrorCode?: string | null;
  error?: AuthErrorLike | null;
}): LoginProblem {
  const { providerErrorCode, error } = input;
  const ref = providerErrorCode ?? error?.code ?? error?.name ?? "unknown";

  if (
    providerErrorCode === "otp_expired" ||
    error?.code === "flow_state_expired" ||
    error?.code === "flow_state_not_found"
  ) {
    return { key: "link-expired", ref };
  }
  if (error?.code === "pkce_code_verifier_not_found" || error?.name === "AuthPKCECodeVerifierMissingError") {
    return { key: "wrong-browser", ref };
  }
  return { key: "callback-failed", ref };
}

export function loginErrorUrl(problem: LoginProblem) {
  const params = new URLSearchParams({ error: problem.key, ref: problem.ref });
  return `/login?${params.toString()}`;
}

// The reference comes from the URL, so only ever show it if it looks like a
// plain error code.
export function safeReference(ref: string | undefined) {
  return ref && /^[A-Za-z0-9_.-]{1,64}$/.test(ref) ? ref : undefined;
}
