#!/bin/sh
set -eu
: "${APPENGINE_ENDPOINT:?Set endpoint}" "${ORG_ID:?Set organization}" "${STAFF_TOKEN:?Set private token}"
# Read-only MCP example. Substitute the actual sheet ID in the JSON file.
curl -sS -X POST "$APPENGINE_ENDPOINT/mcp" \
 -H "orgid: $ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN" \
 -H 'Content-Type: application/json' \
 --data-binary @approval-06-getTimesheet/request.json
