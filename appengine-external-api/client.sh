#!/bin/sh
set -eu
: "${APPENGINE_ENDPOINT:?Set your AppEngine endpoint}"
: "${ORG_ID:?Set your organization}"
: "${STAFF_TOKEN:?Set your private staff token}"
method="$1"; route="$2"
if [ "$#" -ge 3 ]; then
 curl --fail-with-body -sS -i -X "$method" "$APPENGINE_ENDPOINT$route" -H "orgid: $ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN" -H 'Content-Type: application/json' --data-binary "@$3"
else
 curl --fail-with-body -sS -i -X "$method" "$APPENGINE_ENDPOINT$route" -H "orgid: $ORG_ID" -H "Authorization: Bearer $STAFF_TOKEN"
fi
