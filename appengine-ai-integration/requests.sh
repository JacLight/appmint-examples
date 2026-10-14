#!/bin/sh
# Deliberately read-only default. Select write examples in requests.json/Postman.
set -eu
: "${APPMINT_URL:?Set the actual AppEngine URL}"
: "${APPMINT_ORG:?Set your organization}"
: "${STAFF_TOKEN:?Set completed staff session privately}"
: "${EMPLOYEE:?Set the returned employee handle}"
curl --fail-with-body --silent --show-error \
  -H "orgid: $APPMINT_ORG" -H "Authorization: Bearer $STAFF_TOKEN" \
  "$APPMINT_URL/ai-employees/$EMPLOYEE"
