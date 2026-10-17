"""Local verification probe, not autonomous provider delivery."""
import hashlib
import hmac
import time
import urllib.error
import urllib.request


def stripe_test_signature(raw: bytes, secret: str, timestamp=None):
    timestamp = int(time.time()) if timestamp is None else timestamp
    digest = hmac.new(secret.encode(), str(timestamp).encode() + b'.' + raw, hashlib.sha256).hexdigest()
    return f't={timestamp},v1={digest}'


def send_signed_probe(api_origin, organization, raw, secret):
    request = urllib.request.Request(api_origin.rstrip('/') + '/connect/webhook/stripe', data=raw,
        headers={'Content-Type': 'application/json', 'orgid': organization,
                 'Stripe-Signature': stripe_test_signature(raw, secret)}, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()
