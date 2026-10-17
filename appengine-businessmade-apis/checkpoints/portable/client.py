"""Python 3.10+, standard library only. Select one operation explicitly."""
import json, os, re, sys, urllib.request, urllib.error, urllib.parse
from pathlib import Path
ops = json.loads(Path(__file__).with_name('operations.json').read_text())
name = sys.argv[1] if len(sys.argv) > 1 else 'setup-status'
op = next((o for o in ops if o['id'] == name), None)
if not op:
    raise SystemExit('Unknown operation; inspect operations.json')

def required(key):
    value = os.environ.get(key)
    if not value:
        raise SystemExit('Set ' + key)
    return value

def replace(s, path=False):
    return re.sub(
        '\\{\\{([A-Z_]+)\\}\\}',
        lambda m: (
            urllib.parse.quote(required(m[1]), safe="")
            if path else required(m[1])
        ),
        s,
    )

def bind(v):
    if isinstance(v, str):
        return replace(v)
    if isinstance(v, list):
        return [bind(x) for x in v]
    if isinstance(v, dict):
        return {k: bind(x) for k, x in v.items()}
    return v
body = json.dumps(bind(op['body'])).encode() if 'body' in op else None
request = urllib.request.Request(
    required('APPENGINE_API_ORIGIN').rstrip('/') + replace(op['path'], True),
    data=body,
    method=op['method'],
    headers={
        'orgid': required('APPENGINE_ORG_ID'),
        'Authorization': 'Bearer ' + required('STAFF_TOKEN'),
        'Content-Type': 'application/json',
    },
)
try:
    with urllib.request.urlopen(request) as response:
        result = response.read()
except urllib.error.HTTPError as error:
    raise SystemExit(f'{error.code}: {error.read().decode()}')
print(json.dumps(json.loads(result), indent=2))
