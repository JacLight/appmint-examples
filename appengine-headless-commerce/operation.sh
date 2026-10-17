#!/bin/sh
# Generic curl runner. Python 3 reads JSON safely; no jq, eval or shell interpolation.
# sh operation.sh json/operations/option-quote.json
set -eu
exec python3 - "${1:?Pass a request JSON file}" <<'PY'
import json, os, re, subprocess, sys
with open(sys.argv[1]) as f:
    op = json.load(f)
endpoint, org = os.environ.get('APPENGINE_ENDPOINT'), os.environ.get('ORG_ID')
if not endpoint or not org:
    sys.exit('Set APPENGINE_ENDPOINT and ORG_ID')
identity = op.get('identity')
if identity not in ('public', 'staff', 'customer') or not op.get('path', '').startswith('/') or op['path'].startswith('//'):
    sys.exit('Invalid operation identity or relative API path')
token = None if identity == 'public' else os.environ.get('STAFF_TOKEN' if identity == 'staff' else 'CUSTOMER_TOKEN')
if identity != 'public' and not token:
    sys.exit('Set the token for this operation identity: ' + identity)
if op.get('mutation') and os.environ.get('CONFIRM_TEST_OPERATION') != 'yes':
    sys.exit('Review request and set CONFIRM_TEST_OPERATION=yes for this deliberate sandbox mutation')
if re.search(r'YOUR_|SAVED_|SELECTED_|REPLACE_', json.dumps(op)):
    sys.exit('Replace the marked request values from your own saved response')
args = ['curl', '--fail-with-body', '--silent', '--show-error', '--request', op['method'], endpoint.rstrip('/') + op['path'], '--header', 'orgid: ' + org]
if token:
    args += ['--header', 'Authorization: Bearer ' + token]
body = None
if 'body' in op:
    args += ['--header', 'Content-Type: application/json', '--data-binary', '@-']
    body = json.dumps(op['body']).encode()
# No automatic retries: inspect the saved state after any uncertain mutation.
result = subprocess.run(args, input=body)
sys.exit(result.returncode)
PY
