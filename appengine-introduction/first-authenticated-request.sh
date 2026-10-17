#!/usr/bin/env bash
# Requires bash, curl and jq. Uses your own existing AppEngine staff account.
set -euo pipefail
set +x
umask 077
command -v curl >/dev/null
command -v jq >/dev/null
LIVEHOST="https://appengine.appmint.io"
read -r -p "AppEngine URL [$LIVEHOST]: " APPENGINE_ENDPOINT
APPENGINE_ENDPOINT="${APPENGINE_ENDPOINT:-$LIVEHOST}"
APPENGINE_ENDPOINT="${APPENGINE_ENDPOINT%/}"
case "$APPENGINE_ENDPOINT" in https://*) ;; *) printf 'Use your HTTPS AppEngine deployment URL.\n' >&2; exit 1;; esac
read -r -p 'Your organization ID: ' ORG_ID
read -r -p 'Your staff email: ' EMAIL
read -r -s -p 'Your password (hidden): ' PASSWORD
printf '\n'
: "${ORG_ID:?Organization ID required}" "${EMAIL:?Email required}" "${PASSWORD:?Password required}"
WORK=$(mktemp -d)
trap 'unset PASSWORD TOKEN; rm -rf "$WORK"' EXIT
# Secrets enter jq through stdin, not process arguments.
printf '%s\n%s\n' "$EMAIL" "$PASSWORD" |
  jq -Rn '[inputs] | {email: .[0], password: .[1]}' > "$WORK/credentials.json"
unset PASSWORD

HTTP=$(curl -sS --connect-timeout 15 --max-time 60 \
  -o "$WORK/signin.json" -w '%{http_code}' \
  -X POST "$APPENGINE_ENDPOINT/profile/signin" \
  -H 'Content-Type: application/json' -H "orgid: $ORG_ID" \
  --data-binary @"$WORK/credentials.json")
rm -f "$WORK/credentials.json"
printf 'Sign-in HTTP %s\n' "$HTTP"
case "$HTTP" in 2??) ;; *) printf 'Sign-in failed. Check the deployment URL, organization ID and credentials, then retry.\n' >&2; exit 1;; esac
if ! jq -e '.token | type == "string" and length > 0' "$WORK/signin.json" >/dev/null; then
  jq '{requiresPasswordChange, requiresTwoFactor, isNewDevice, twoFactorMethod}' "$WORK/signin.json"
  printf 'No session token. This basic example stops here. For a temporary password, complete the password-change flow and rerun. For MFA or a device challenge, use the documented challenge-verification flow to obtain a session token before making the protected request. Do not treat HTTP success as a completed session.\n' >&2
  exit 1
fi
jq '{responseKeys: keys, token: "[redacted]", refreshToken: (if .refreshToken then "[redacted]" else null end)}' "$WORK/signin.json"
TOKEN=$(jq -er '.token' "$WORK/signin.json")
# Store request headers privately instead of exposing the token as a curl process argument.
printf 'Authorization: Bearer %s\norgid: %s\n' "$TOKEN" "$ORG_ID" > "$WORK/headers"
EMAIL_PATH=$(printf '%s' "$EMAIL" | jq -sRr @uri)
HTTP=$(curl -sS --connect-timeout 15 --max-time 60 \
  -o "$WORK/profile.json" -w '%{http_code}' \
  "$APPENGINE_ENDPOINT/profile/user/profile/$EMAIL_PATH" \
  -H @"$WORK/headers")
printf 'Own-profile HTTP %s\n' "$HTTP"
case "$HTTP" in 2??) ;; *) printf 'Profile request failed. Keep the same orgid and renew the session if expired.\n' >&2; exit 1;; esac
jq -e --arg email "$EMAIL" '.datatype == "user" and .data.email == $email' "$WORK/profile.json" >/dev/null
jq '{datatype, firstName: .data.firstName, lastName: .data.lastName}' "$WORK/profile.json"
printf 'Verified: returned your own staff profile.\n'
