#!/bin/sh
set -eu
: "${APPENGINE_API_ORIGIN:?Set your assigned backend origin}"
: "${APPENGINE_ORG_ID:?Set your organization}"
: "${STAFF_TOKEN:?Set your authorized staff token}"
curl --fail-with-body --silent --show-error "$APPENGINE_API_ORIGIN/business-made/books/accounts?page=1&pageSize=100" -H "orgid: $APPENGINE_ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN"
