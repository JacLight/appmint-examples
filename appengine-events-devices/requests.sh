#!/bin/sh
# Select ONE request; responses remain JSON. No retry and no redirect-following.
set -eu
: "${APPMINT_URL:?Set your API address}" "${APPMINT_ORG:?Set organization}" "${STAFF_TOKEN:?Complete staff sign-in}"
example_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
request_tmp=$(mktemp -d)
trap 'rm -rf "$request_tmp"' EXIT HUP INT TERM
python3 - "$example_dir/requests.json" "${1:?Select a request name from requests.json}" "$request_tmp" <<'PY'
import json,os,re,sys,urllib.parse
from pathlib import Path
op=next((x for x in json.load(open(sys.argv[1])) if x['name']==sys.argv[2]),None)
if op is None:raise SystemExit('Unknown request name')
if op['body'] is not None and os.environ.get('ENABLED_ACTION')!=op['name']:raise SystemExit('Set ENABLED_ACTION to this deliberate action name; do not run all writes blindly.')
def sub(text,path=False):
 def value(m):
  key=m[1].upper();v=os.environ.get(key)
  if not v:raise SystemExit('Set '+key)
  return urllib.parse.quote(v,safe='') if path else v
 return re.sub(r'\{\{(\w+)\}\}',value,text)
def walk(v):
 if isinstance(v,str):return sub(v)
 if isinstance(v,dict):return {k:walk(x) for k,x in v.items()}
 if isinstance(v,list):return [walk(x) for x in v]
 return v
p=Path(sys.argv[3]);(p/'method').write_text(op['method']);(p/'route').write_text(sub(op['path'],True))
if op['body'] is not None:(p/'body').write_text(json.dumps(walk(op['body'])))
PY
if [ -f "$request_tmp/body" ]; then
 curl --silent --show-error --fail-with-body --max-time 30 --request "$(cat "$request_tmp/method")" --header "orgid: $APPMINT_ORG" --header "Authorization: Bearer $STAFF_TOKEN" --header 'Content-Type: application/json' --data-binary "@$request_tmp/body" "${APPMINT_URL%/}$(cat "$request_tmp/route")"
else
 curl --silent --show-error --fail-with-body --max-time 30 --header "orgid: $APPMINT_ORG" --header "Authorization: Bearer $STAFF_TOKEN" "${APPMINT_URL%/}$(cat "$request_tmp/route")"
fi
