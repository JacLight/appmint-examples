#!/bin/sh
# Choose the method, route and optional body file from operations.json.
# Example: ./request.sh GET /jobs/scheduled
set -eu
: "${APPMINT_BASE:?Set APPMINT_BASE}" "${ORG_ID:?Set ORG_ID}" "${STAFF_TOKEN:?Set STAFF_TOKEN}"
method=${1:-GET}
route=${2:-/jobs/scheduled}
if [ "$#" -gt 2 ]; then
 curl --fail-with-body -sS -i -X "$method" "$APPMINT_BASE$route" -H "orgid: $ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN" -H 'Content-Type: application/json' --data-binary "@$3"
else
 curl --fail-with-body -sS -i -X "$method" "$APPMINT_BASE$route" -H "orgid: $ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN"
fi
