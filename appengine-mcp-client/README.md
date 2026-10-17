# AppEngine MCP AI Client Integration companions

The manuscript is at /tutorials-plan/course-content/courses/connect-ai-client-to-business/script.md. Recorded IDs and responses are from an isolated training environment; replace them with your own employee/sheet IDs before execution. No tokens or passwords are included. Do not run the request folders in a batch.

## Actual AI host
Install/sign into an MCP-capable host. Codex MCP configuration: https://learn.chatgpt.com/docs/extend/mcp?surface=cli . Supply your endpoint, organization and private staff token using client-config.toml. The AI host account and AppEngine identity are separate. Ask a bounded question, review requested writes and inspect actual saved results. The sequence JSON files identify actual captured Codex tool events; observed.json is a historical response, not a new result.

## Raw protocol inspection
Node20+ or Python3.10+ runners use only built-in libraries. Set APPENGINE_ENDPOINT, ORG_ID and STAFF_TOKEN privately. Select one request directory:

    node call.mjs approval-06-getTimesheet
    python3 call.py approval-06-getTimesheet

TypeScript: run `npm install`, then `npm run check` and `npm run call:ts -- approval-06-getTimesheet`. Its logic is identical to the Node runner. Curl: `sh call.sh` performs the labelled read-only example; edit its request JSON with your own sheet ID first. Import postman.json and supply its three environment values privately for Postman. These raw clients do not contain an AI model. For a write, inspect the exact JSON and add --allow-write deliberately. They never retry automatically. Postman requests marked WRITE require the same review. Use individual Send; do not run the entire collection.

## Setup
Use the employee record sk, not the display employee code, when creating a sheet. Replace all cross-record IDs, dates and email with controlled values. The numbered employee, create-sheet, add-entry and submit requests show the full sequence. A sheet must have entries and be submitted before approval. Avoid overlapping periods and never generate payroll for these practice hours.

## Outcomes and boundaries
The actual main AI run approved one eight-hour sheet and read it again. Conditional run saw an overtime-typed entry despite policy totals classifying the10h as regular and declined to write. Denied run lacked content permission. Draft validation returned Only submitted timesheets can be approved. Recovery used a test transport that dropped the successful approval response; the real host read the saved result without repeating the approval.

MCP discovery can be anonymous. call_service requires organization authentication and content read; it does not replay every REST menu guard. approvedById is supplied by the caller, not automatically injected from the token. Disabling call_service means discovery-only; it is not a per-method read-only policy. Prompts are not server authorization.

## Failure handling
Inspect HTTP status, JSON-RPC error and tool isError. Keep the target record ID. On a transport failure read the record; do not blindly replay approval or create a new record. Sign in again on expired credentials and restart a host whose environment was read at launch. Repository history for the recorded main fixture had total0; saved sheet/entry stamps are the demonstrated evidence.

## Course source publication

This folder contains the downloadable companion supplied with **AppEngine MCP: Connect an AI Client**. Replace training identifiers and paths with your own. Recorded results are examples, not a live connection or credentials. Use the current [AppEngine API reference](https://appengine.appmint.io/documentation) for changing contracts. The course reader retains its verification limits.
