curl --silent --show-error --include -X PATCH "$APPENGINE_URL/workflow/definition/6acb15c8ba781cd23c2f6e42" \
  -H "orgid: $APPENGINE_ORG" \
  -H "Authorization: Bearer $APPENGINE_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @request.json
