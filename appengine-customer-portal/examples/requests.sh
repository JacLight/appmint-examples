#!/usr/bin/env bash
# Source this file, then invoke a named function. No calls run automatically.
# Curl exercises are server-side teaching equivalents, not a browser authorization gate.
portal_request() {
  : "${API:=https://appengine.appmint.io}" "${ORG:?Set ORG}" "${CUSTOMER_TOKEN:?Set CUSTOMER_TOKEN}"
  local method="$1" path="$2"
  shift 2
  curl --fail-with-body --silent --show-error -X "$method" "$API$path" -H "orgid: $ORG" -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' "$@"
}
portal_profile() { portal_request GET /client-data/profile; }
portal_orders() { portal_request GET /client-data/orders; }
portal_reservations() { portal_request GET /client-data/reservations; }
portal_forms() { portal_request GET '/client-data/forms?page=1&limit=20'; }
portal_tickets() { portal_request GET /client-data/tickets; }
portal_phone() { portal_request PUT /client-data/profile --data-binary @profile-patch.json; }
portal_members() { portal_request GET "/client-data/shared-accounts/${ACCOUNT_ID:?Set ACCOUNT_ID}/members"; }
portal_company_orders() { portal_request GET "/client-data/shared-accounts/${ACCOUNT_ID:?Set ACCOUNT_ID}/orders?page=1&limit=20"; }
portal_switch() { portal_request POST /profile/customer/shared-account --data-binary @account-choice.json; }
portal_personal() { portal_request POST /profile/customer/shared-account --data '{}'; }
# After either switch, replace BOTH stored token and refresh token from response.
# For derived availability→move and guarded cancellation use portal.mjs/portal.py;
# those prevent accepting an unverified email/code from browser request input.
