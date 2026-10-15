#!/usr/bin/env bash
set -euo pipefail
# Source this file, then call request METHOD /path [body.json].
# Do not enable shell tracing: TOKEN is private. Set BASE, ORG and optional TOKEN
# in your environment; the endpoint belongs to your AppEngine deployment.
request() {
  : "${BASE:?Set your AppEngine HTTPS endpoint}" "${ORG:?Set your organization ID}"
  local method="$1" route="$2" body="${3:-}"
  local args=(--silent --show-error --fail-with-body -X "$method" "$BASE$route" -H 'Content-Type: application/json' -H "orgid: $ORG")
  if [ -n "${TOKEN:-}" ]; then args+=(-H "Authorization: Bearer $TOKEN"); fi
  if [ -n "$body" ]; then args+=(--data-binary "@$body"); fi
  curl "${args[@]}"
}
# Examples (save JSON bodies from requests.json, replacing placeholders):
# request POST /profile/customer/signin signin.json
# request GET "/repository/collections/$FORM_COLLECTION_NAME"
# request POST /crm/reservations/slots slots.json
# request POST /client-data/reservations create.json
# request GET "/client-data/reservations/$BOOKING_ID"
# request POST "/crm/reservations/reschedule/$BOOKING_ID" move.json
# request DELETE "/crm/reservations/cancel/$EMAIL_ENCODED/$BOOKING_CODE"
# Responses are raw JSON. Preserve HTTP failures; do not hide them with a filter.
