#!/usr/bin/env bash
set -euo pipefail
: "${APPENGINE_API_ORIGIN:?}" "${APPENGINE_ORG:?}" "${APPENGINE_STAFF_TOKEN:?}" "${APPENGINE_CONFIG_ID:?}"
curl --fail-with-body -sS "$APPENGINE_API_ORIGIN/upstream/integration-types/StripeProvider" -H "orgid: $APPENGINE_ORG" -H "Authorization: Bearer $APPENGINE_STAFF_TOKEN"
python3 - <<'PY' | curl --fail-with-body -sS -X POST "$APPENGINE_API_ORIGIN/upstream/call/StripeProvider/test" -H "orgid: $APPENGINE_ORG" -H "Authorization: Bearer $APPENGINE_STAFF_TOKEN" -H 'Content-Type: application/json' --data-binary @-
import json,os
print(json.dumps({'configId':os.environ['APPENGINE_CONFIG_ID'],'data':{}}))
PY
python3 - <<'PY' | curl --fail-with-body -sS -X POST "$APPENGINE_API_ORIGIN/upstream/call/StripeProvider/listEvents" -H "orgid: $APPENGINE_ORG" -H "Authorization: Bearer $APPENGINE_STAFF_TOKEN" -H 'Content-Type: application/json' --data-binary @-
import json,os,time
print(json.dumps({'configId':os.environ['APPENGINE_CONFIG_ID'],'data':{'limit':20,'types':['payment_intent.succeeded'],'createdGte':int(time.time())-3600}}))
PY
