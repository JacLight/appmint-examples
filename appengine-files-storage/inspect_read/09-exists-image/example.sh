#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/exists'
curl -sS -i -X POST \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
