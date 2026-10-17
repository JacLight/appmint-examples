#!/usr/bin/env bash
set -euo pipefail
: "${APPENGINE_API_ORIGIN:?Set assigned API origin}"
: "${APPENGINE_ORG_ID:?Set organization ID}"
: "${APPENGINE_STAFF_TOKEN:?Set staff token privately}"
# Read-only example. Full operation bodies are in operations.json and Postman.
curl --fail-with-body --silent --show-error \
  "$APPENGINE_API_ORIGIN/repository/find/campaign" \
  -H "orgid: $APPENGINE_ORG_ID" \
  -H "Authorization: Bearer $APPENGINE_STAFF_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"query":{"data.type":"billboard"},"options":{"page":1,"pageSize":2,"sort":"data.name","sortType":1}}'
