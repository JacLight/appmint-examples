#!/usr/bin/env bash
set -euo pipefail
: "${APPMINT_URL:?Set the maintained AppEngine address}"
: "${APPMINT_ORG:?Set your organization}"
: "${STAFF_TOKEN:?Use a completed ordinary staff session}"
# This default curl sequence only reads readiness. No token printing or tracing.
for path in phone/user-phones phone/voice/app phone/voice/devices crm/communications/calls; do
 curl --fail-with-body --silent --show-error "$APPMINT_URL/$path" -H "orgid: $APPMINT_ORG" -H "Authorization: Bearer $STAFF_TOKEN"
 printf '\n'
done
# Explicit single-operation examples, including writes, are in requests.json/request.py.
