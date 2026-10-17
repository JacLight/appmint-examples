#!/usr/bin/env bash
set -euo pipefail
: "${APPENGINE_ENDPOINT:?Set your endpoint}" "${ORG_ID:?Set your organization}" "${CUSTOMER_TOKEN:?Sign in as the owning customer}" "${BOOKING_ID:?Use an actual saved booking ID}"
# --fail-with-body preserves error JSON and makes HTTP failures stop the script.
# No set -x: it would expose Authorization.
curl --silent --show-error --fail-with-body --max-time 10 \
 -H "orgid: $ORG_ID" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
 "${APPENGINE_ENDPOINT%/}/client-data/reservations/$BOOKING_ID"
printf '\n'
