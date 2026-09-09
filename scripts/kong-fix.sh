#!/usr/bin/env bash
# Restarts Kong (the local Supabase stack's API gateway) and waits until
# it's actually proxying to auth correctly again — not just until Docker
# reports the container "healthy", which has been observed to say healthy
# while still returning 502s.
#
# Needed because `supabase start`/`stop`/`db reset` restart the auth
# container, and Kong doesn't always reconnect to it on its own —
# symptom is every login attempt failing with a 502 Bad Gateway
# ("An invalid response was received from the upstream server"). See
# setup.md's "Known quirk" note. Safe to run even when Kong is already
# fine — exits immediately in that case.
set -euo pipefail

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

check_kong() {
  curl -s -o /dev/null -w "%{http_code}" --max-time 5 -X POST \
    "http://127.0.0.1:54321/auth/v1/otp" \
    -H "Content-Type: application/json" \
    -H "apikey: $ANON_KEY" \
    -d '{"email":"kong-healthcheck@example.com"}' 2>/dev/null || echo "000"
}

if [ "$(check_kong)" = "200" ]; then
  echo "Kong is already healthy."
  exit 0
fi

if ! docker ps -a --format '{{.Names}}' | grep -q '^supabase_kong_camstreets$'; then
  echo "supabase_kong_camstreets doesn't exist — is the local stack set up? (pnpm exec supabase status)"
  exit 1
fi

# `docker restart` works whether the container is currently running,
# stopped, or unhealthy — no need to branch on its current state first.
echo "Kong isn't proxying to auth correctly — restarting it..."
docker restart supabase_kong_camstreets > /dev/null

for _ in $(seq 1 15); do
  sleep 1
  if [ "$(check_kong)" = "200" ]; then
    echo "Kong is healthy again."
    exit 0
  fi
done

echo "Kong still isn't responding correctly after a restart — something else may be wrong."
exit 1
