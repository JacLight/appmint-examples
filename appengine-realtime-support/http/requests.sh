#!/bin/sh
# Run from the http directory. Variables stay in your local environment.
set -eu
: "${APPENGINE_URL:?Set APPENGINE_URL}" "${APPENGINE_ORG:?Set APPENGINE_ORG}"
case "${1:-}" in
 assistant-create|chat-config-create|assistant-enable-handoff)
  : "${APPENGINE_STAFF_TOKEN:?Set APPENGINE_STAFF_TOKEN}"
  body=$(mktemp); trap 'rm -f "$body"' EXIT HUP INT TERM
  python3 render.py "$1" > "$body"
  if [ "$1" = assistant-create ]; then method=POST; route=/crm/ai-assistant
  elif [ "$1" = assistant-enable-handoff ]; then method=PUT; route=$(python3 -c 'import os,urllib.parse; print("/crm/ai-assistant/"+urllib.parse.quote(os.environ["APPENGINE_ASSISTANT_ID"],safe=""))')
  else method=PUT; route=/repository/create; fi
  curl -sS -i -X "$method" "$APPENGINE_URL$route" -H "orgid: $APPENGINE_ORG" -H "Authorization: Bearer $APPENGINE_STAFF_TOKEN" -H 'Content-Type: application/json' --data-binary "@$body" ;;
 chat-config-get)
  route=$(python3 -c 'import os,urllib.parse; print("/chat/config/"+urllib.parse.quote(os.environ["APPENGINE_CHAT_CONFIG"],safe=""))')
  curl -sS -i "$APPENGINE_URL$route" -H "orgid: $APPENGINE_ORG" ;;
 guest-auth)
  : "${APPENGINE_APP_ID:?Existing app identity required}"
  body=$(mktemp); trap 'rm -f "$body"' EXIT HUP INT TERM
  python3 render.py guest-auth > "$body"
  curl -sS -i -X POST "$APPENGINE_URL/profile/guest/auth" -H "orgid: $APPENGINE_ORG" -H "appId: $APPENGINE_APP_ID" -H 'Content-Type: application/json' --data-binary "@$body" ;;
 offline-ticket-create)
  : "${APPENGINE_GUEST_TOKEN:?Set the fresh guest token for these visitor details}"
  body=$(mktemp); trap 'rm -f "$body"' EXIT HUP INT TERM
  python3 render.py offline-ticket-create > "$body"
  curl -sS -i -X POST "$APPENGINE_URL/crm/tickets/chat-request" -H "orgid: $APPENGINE_ORG" -H "Authorization: Bearer $APPENGINE_GUEST_TOKEN" -H 'Content-Type: application/json' --data-binary "@$body" ;;
 chat-upload)
  : "${2:?Provide local file}"
  route=$(python3 -c 'import os,urllib.parse; q=lambda k:urllib.parse.quote(os.environ[k],safe=""); print("/chat/upload/"+q("APPENGINE_CHAT_CONFIG")+"/"+q("APPENGINE_CUSTOMER_EMAIL"))')
  curl -sS -i -X POST "$APPENGINE_URL$route" -H "orgid: $APPENGINE_ORG" -F "files=@$2" ;;
 *) echo 'Choose assistant-create, chat-config-create, chat-config-get, guest-auth, offline-ticket-create or chat-upload' >&2; exit 2 ;;
esac
