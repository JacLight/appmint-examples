#!/bin/sh
set -eu
: "${APPENGINE_API_ORIGIN:?Set your assigned API origin}"
: "${APPENGINE_ORG_ID:?Set your organization ID}"
: "${MANAGER_TOKEN:?Set the authorized manager token}"
: "${SCHEDULE_ID:?Set the saved draft schedule record ID}"
case "$SCHEDULE_ID" in *[!A-Za-z0-9_-]*) echo 'Use the exact saved record ID' >&2; exit 1;; esac
curl --fail-with-body --silent --show-error -X POST "$APPENGINE_API_ORIGIN/business-made/schedules/$SCHEDULE_ID/publish" \
 -H "orgid: $APPENGINE_ORG_ID" -H "Authorization: Bearer $MANAGER_TOKEN" \
 -H 'Content-Type: application/json' --data '{}'
