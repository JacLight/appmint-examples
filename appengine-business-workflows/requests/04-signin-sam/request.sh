curl --silent --show-error --include -X POST "$APPENGINE_URL/profile/user/signin" \
  -H "orgid: $APPENGINE_ORG" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
