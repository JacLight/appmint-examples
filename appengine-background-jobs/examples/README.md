# Runnable AppEngine scheduled-job examples

Use ONE client, not all clients for the same create operation. The JSON contracts are shared. Node JavaScript executed the complete training workflow; Python and TypeScript perform an authenticated read-only smoke check. Postman/curl are equivalent request formats, not claims of separate full mutation rehearsals.

Set APPMINT_BASE to the AppEngine address assigned to your organization, ORG_ID to your organization ID, STAFF_TOKEN to a staff session token. Never commit the token or put it in a public web/mobile app. PREFIX must be unique for your practice pipeline.

## Run the connected workflow

1. `node client.mjs inspect` (or `python3 client.py inspect`, `node --experimental-strip-types client.ts inspect`). Find `lead-stage-sla`, its enabled/inUse/queued states and current settings.
2. `node client.mjs create-pipeline --write`. Save result.sk as PIPELINE_ID.
3. `node client.mjs create-lead --write`. Save result.sk as LEAD_ID. No outside email is sent by these example requests.
4. `node client.mjs set-rule --write` saves24hour create_task SLA. Optional owner: set the lead's assignedTo to a valid staff member through the normal lead update API; do not claim a delivered notification from assignment alone.
5. Only on this practice record, `node client.mjs age-practice-lead --write` sets its stage entry to25hours ago. For real data, normal stage movement establishes the clock.
6. `node client.mjs run --write`. Save result.result.jobId as JOB_ID.
7. `node client.mjs get-job`, `node client.mjs get-lead`, `node client.mjs get-tasks`. Expect done, the matching stage breach stamp, and one task linked to LEAD_ID.
8. Run again and query tasks again. Expect zero processed and still one task.
9. Read and preserve your settings before `pause --write` or `hourly --write`. Pause is not rollback. An automatic worker run reports trigger schedule in history. Hosted worker is provided; self-hosted deployments need Redis and ENABLE_SYNC=true.
10. For an actually failed run, correct the cause, set JOB_ID to that failed run and `retry --write`. Replace JOB_ID with the NEW result.sk, poll get-job to terminal status, then inspect the task. retryOf connects the new run to the failed one. Done runs with item failures are corrected then rerun; they are not eligible for retry.
11. `auto-move --write` changes the stage action. Use a fresh owned overdue lead and verify stageId changed to followup. Restore set-rule afterward.
12. For the custom alternative, create your collection using the linked Database course; set MARKER_DATATYPE. Run create-marker --write and save result.sk as MARKER_ID. Run create-custom-schedule --write (future date generated automatically), save result.sk as SCHEDULE_ID, then queue to locate its exact entry.
13. To cancel a future custom schedule, set QUEUE_JOB_ID to its exact queue entry, then `cancel-schedule --write`. This is not the schedule record ID. Existing target effects are not rolled back.

Use `python3 client.py STEP --write` or `node --experimental-strip-types client.ts STEP --write` for the same operations. Standard-library Python requires no pip installation. Node requires global fetch (18+); TypeScript direct execution uses Node22.6+ type stripping. For curl, save the desired operation's body into request.json after replacing placeholders, then `sh request.sh METHOD /exact/route request.json`. No jq required; responses are JSON. Postman import carries equivalent requests and stores IDs from successful create/run responses. Store credentials as private local environment values and do not export them.

## Important boundaries

The practice fixture leaves tasks unassigned and does not demonstrate outbound notify/escalate delivery. The current lead SLA handler does not cooperate with per-item cancellation; pause future scans. Separate leads with identical fullName in one stage can collide on generated task name; report/fix the naming cause, do not change real customer names to work around it. Job done can still contain failed items. A built-in job is registered server implementation, not arbitrary code submitted through POST jobs. Use the exact linked Scheduling course for bounded cron/timezone/start/end schedules.
