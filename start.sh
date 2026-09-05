#!/usr/bin/env bash
set -euo pipefail

# Start the whole stack: Postgres (Docker), backend API, frontend.
# Ctrl+C stops the API and frontend. The DB container keeps running
# (stop it with: cd backend && npm run db:down).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Starting Postgres (Docker)..."
(cd "$ROOT/backend" && npm run db:up)

# Give Postgres a moment to accept connections.
sleep 2

echo "==> Starting backend API on http://localhost:4000"
(cd "$ROOT/backend" && npm run dev) &
API_PID=$!

echo "==> Starting frontend on http://localhost:5173"
(cd "$ROOT/starter" && npm run dev) &
WEB_PID=$!

# On exit, stop both dev servers.
cleanup() {
  echo ""
  echo "==> Stopping servers..."
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "==> Up. API :4000  |  Web :5173  |  Ctrl+C to stop."
echo "    Login with any seed user, password: password123"
echo ""

wait
