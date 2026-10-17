#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/file/upload'
curl -sS -i -X POST "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cedar-botanical-print.png" \
  -F "location=course-files-1009" \
  -F "isPrivate=false"
