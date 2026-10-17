#!/bin/sh
set -eu
: "${ORG_ID:?Set ORG_ID}"
BASE="${BASE:-https://appengine.appmint.io}"
ROUTE='/repository/get/sf_product/6ac99bdff5d6b011f6e10eeb'
curl -sS -i -X GET \
  "$BASE$ROUTE" \
  -H "orgid: $ORG_ID" \
  -H "Authorization: Bearer $TOKEN"
