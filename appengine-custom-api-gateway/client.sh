#!/bin/sh
set -eu
GATEWAY_BASE=${GATEWAY_BASE:-http://127.0.0.1:4320}
COOKIE_JAR=${COOKIE_JAR:-$HOME/.appengine-gateway-curl-cookies}
umask 077
case "${1:-profile}" in
 signin)
  # Private env values become a temporary request; never echo the password.
  : "${CUSTOMER_EMAIL:?Set CUSTOMER_EMAIL}" "${CUSTOMER_PASSWORD:?Set CUSTOMER_PASSWORD}"
  request=$(mktemp)
  trap 'rm -f "$request"' EXIT
  python3 -c 'import os,json; print(json.dumps({"email":os.environ["CUSTOMER_EMAIL"],"password":os.environ["CUSTOMER_PASSWORD"]}))' > "$request"
  curl -sS -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" -H 'Content-Type: application/json' --data-binary "@$request" "$GATEWAY_BASE/auth/signin";;
 logout) curl -sS -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$GATEWAY_BASE/auth/logout";;
 profile|reservations) curl -sS -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$GATEWAY_BASE/api/$1";;
 reservation) curl -sS -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$GATEWAY_BASE/api/reservations/${2:?Supply reservation ID}";;
 *) echo 'Use signin, profile, reservations, reservation ID, logout' >&2; exit 2;;
esac
