#!/bin/sh
set -eu
: "${APPENGINE_API_ORIGIN:?Set your assigned API origin}"
: "${APPENGINE_ORG_ID:?Set your organization ID}"
: "${STAFF_TOKEN:?Set the employee token}"
: "${START_DATE:?Set YYYY-MM-DD}"
: "${END_DATE:?Set YYYY-MM-DD}"
curl --fail-with-body --silent --show-error --get "$APPENGINE_API_ORIGIN/staff-portal/time-off/cost" \
 --data-urlencode "startDate=$START_DATE" --data-urlencode "endDate=$END_DATE" \
 -H "orgid: $APPENGINE_ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN"
