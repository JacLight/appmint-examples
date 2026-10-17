#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/driver'
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
