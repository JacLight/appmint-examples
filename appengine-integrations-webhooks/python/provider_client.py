"""Server-side, read-only integration checks. Never put these credentials in a mobile app."""
import json, os, urllib.request
ORIGIN = os.environ['APPENGINE_API_ORIGIN'].rstrip('/')
ORG = os.environ['APPENGINE_ORG']
TOKEN = os.environ['APPENGINE_STAFF_TOKEN']
CONFIG = os.environ['APPENGINE_CONFIG_ID']
def request(method, path, body=None):
    req = urllib.request.Request(ORIGIN + path, method=method,
        headers={'orgid': ORG, 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
        data=None if body is None else json.dumps(body).encode())
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.load(response)
def provider(operation, data=None):
    return request('POST', '/upstream/call/StripeProvider/' + operation,
                   {'configId': CONFIG, 'data': data or {}})
def recent_payment_events(created_gte):
    cursor = None
    while True:
        payload = {'types': ['payment_intent.succeeded'], 'createdGte': created_gte, 'limit': 50}
        if cursor:
            payload['startingAfter'] = cursor
        page = provider('listEvents', payload)
        yield from page['data']
        if not page.get('hasMore'):
            break
        next_cursor = page['data'][-1]['id'] if page['data'] else None
        if not next_cursor or next_cursor == cursor:
            raise ValueError('Invalid event pagination cursor')
        cursor = next_cursor
