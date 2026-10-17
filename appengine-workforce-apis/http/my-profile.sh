#!/bin/sh
set -eu
: "${APPENGINE_API_ORIGIN:?Set your assigned API origin}"
: "${APPENGINE_ORG_ID:?Set your organization ID}"
: "${STAFF_TOKEN:?Set the employee token}"
curl --fail-with-body --silent --show-error "$APPENGINE_API_ORIGIN/staff-portal/profile" \
  -H "orgid: $APPENGINE_ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN"
