#!/bin/sh
# Request references: prints safe key metadata or one repository page, not a full export.
set -eu
: "${APPENGINE_API_ORIGIN:?Set your assigned API origin}"
: "${APPENGINE_ORG:?Set your organization}"
case "${1:-page}" in
metadata)
 : "${APPENGINE_STAFF_TOKEN:?Set your staff session token}" "${APPENGINE_KEY_ID:?Set your own key management ID}"
 curl --fail-with-body --silent --show-error -H "orgid: $APPENGINE_ORG" -H "Authorization: Bearer $APPENGINE_STAFF_TOKEN" "$APPENGINE_API_ORIGIN/api-key/$APPENGINE_KEY_ID"
 ;;
page)
 : "${APPENGINE_JOB_KEY:?Set your scoped job key}"
 curl --fail-with-body --silent --show-error -X POST -H "orgid: $APPENGINE_ORG" -H "x-api-key: $APPENGINE_JOB_KEY" -H 'Content-Type: application/json' --data '{"query":{"data.status":"confirmed"},"options":{"page":1,"pageSize":50}}' "$APPENGINE_API_ORIGIN/repository/find/reservation"
 ;;
*) printf '%s\n' 'Use page or metadata' >&2;exit 2;;
esac
