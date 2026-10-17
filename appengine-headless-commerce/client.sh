#!/bin/sh
set -eu
: "${APPENGINE_ENDPOINT:?Set APPENGINE_ENDPOINT}"
: "${ORG_ID:?Set ORG_ID}"
command=${1:-products}
case "$command" in
products) route='storefront/products?p=1&ps=12';;
product) route="storefront/product/${2:?SKU}";;
cart) route='storefront/cart/mine';;
orders) route='client-data/orders';;
order) route="client-data/orders/${2:?ORDER_NUMBER}";;
gateways) route='storefront/payment-gateways';;
shipping|quote) route='shipping/options'; [ "$command" != quote ] || route='storefront/pricing/calculate-cart'; curl --fail-with-body -sS "$APPENGINE_ENDPOINT/$route" -H "orgid: $ORG_ID" -H "Authorization: Bearer ${CUSTOMER_TOKEN:?Set customer token privately}" -H 'Content-Type: application/json' --data-binary "@${2:?JSON_FILE}"; exit;;
*) echo 'products | product SKU | cart | orders | order NUMBER | gateways | shipping FILE | quote FILE' >&2; exit 2;;
esac
curl --fail-with-body -sS "$APPENGINE_ENDPOINT/$route" -H "orgid: $ORG_ID" -H "Authorization: Bearer ${CUSTOMER_TOKEN:-}"
