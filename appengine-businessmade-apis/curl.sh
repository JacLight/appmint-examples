#!/bin/sh
set -eu
: "${APPENGINE_API_ORIGIN:?Set your assigned API origin}"
: "${APPENGINE_ORG_ID:?Set your organization}"
: "${STAFF_TOKEN:?Set your signed-in staff token}"
: "${LOCATION_NAME:?Set the saved location name}"
curl --fail-with-body --silent --show-error --get "$APPENGINE_API_ORIGIN/storefront/pos/readiness" --data-urlencode "businessLocationId=$LOCATION_NAME" -H "orgid: $APPENGINE_ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN"
