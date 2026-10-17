# Portable request examples

These are readable copies of the existing Business Operations companion's TypeScript helper and Python operation runner. They use the same current contracts; they do not reproduce the whole browser application. TypeScript formatting changes no contracts; the Python abstract syntax tree is unchanged. `operations.json` is the exact shared operation catalogue required by the Python runner.

For a read-only branch readiness request, supply your own environment values without committing them:

```sh
export APPENGINE_API_ORIGIN='https://YOUR_ASSIGNED_APPENGINE_BACKEND'
export APPENGINE_ORG_ID='YOUR_ORGANIZATION'
export STAFF_TOKEN='YOUR_STAFF_SESSION_TOKEN'
export LOCATION_NAME='YOUR_SAVED_LOCATION_NAME'
python3 client.py readiness
```

Other named operations may write real records. Select them deliberately, keep returned IDs and read current server totals before payment recording. `BusinessOperationsClient.recordCash(tabId)` reads `balanceDue` and refuses a non-positive balance. It records a manual tender; it does not collect a card payment.

The original JavaScript, curl and Postman examples remain one level above the checkpoints directory in the course companion. Use the parent README for their run instructions.
