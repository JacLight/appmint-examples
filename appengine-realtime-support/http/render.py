"""Render a JSON body for curl without jq; does not send an HTTP request."""
import json,sys
from client import HERE,OPS,expand
op=OPS[sys.argv[1]]
if not op.get('body'):raise SystemExit('This action has no JSON body')
print(json.dumps(expand(json.loads((HERE/'json'/op['body']).read_text())),indent=2))
