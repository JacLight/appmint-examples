# AppEngine Scheduled Jobs and Failure Recovery

Build a complete scheduled integration: a stalled lead becomes a saved follow-up task through AppEngine's registered lead-stage job. Configure the business rule, verify a manual run, observe the worker execute it automatically, inspect both run history and the actual task, then repair a failed run and follow its retry. This is a developer use case, not a general lesson on writing timers.

[AppEngine course catalogue](/videos/course-catalogue/?product=AppEngine#developer-path) · [Video review](review.html) · [Runnable examples](examples/README.md)

## Before you start

Open [Appmint Studio](https://studio.appmint.io/). You need an organization you can edit, its assigned AppEngine endpoint, and an authenticated **staff** session with the relevant CRM/repository permissions. Organization user creation does not require platform-root access. Keep staff tokens on a trusted server or development workstation, never inside a public browser/mobile bundle.

The series covers these prerequisites in [API Foundations](../../appengine-api-foundations/course/review.html). Direct video chapters: [organization and addresses,0:50](../../appengine-api-foundations/course/course.mp4#t=50.233), [staff and customer identity,7:11](../../appengine-api-foundations/course/course.mp4#t=431.233). Obtain your real organization ID, endpoint and staff bearer token there; do not infer an endpoint from an organization name. For field-level contracts use the [AppEngine API reference](https://appengine.appmint.io/documentation).

Set local environment variables `APPMINT_BASE`, `ORG_ID`, `STAFF_TOKEN`, and a unique `PREFIX` for your practice fixture. The companion programs read those values without putting credentials in source files. `node client.mjs inspect`, `python3 client.py inspect`, or `node --experimental-strip-types client.ts inspect` performs the same read-only discovery. Node's JavaScript client requires18+; direct TypeScript execution requires22.6+ type stripping. Python uses its standard library.

Every request uses `orgid: ORG_ID` and `Authorization: Bearer STAFF_TOKEN`; JSON writes also use `Content-Type: application/json`. Choose **one** client for mutations. Running the create operation from every language creates extra records; it is not extra verification.

## 1. Understand the three separate objects

The pipeline stage holds the rule: after24hours in Contacted, create a task. The registered `lead-stage-sla` job supplies the implementation. Its schedule controls how often AppEngine checks. A60minute scan interval does not make the24hour threshold become one hour.

![Concept: pipeline rule, registered job, scanning clock, task and job history](/videos/appengine-background-jobs-usecase/production/concepts/model/qa/cue-8.png)

This is a concept illustration. The remaining sections show actual requests, saved data and Studio screens. A **job ID** identifies one execution; a **schedule ID** identifies the plan; a **lead ID** identifies the business record. They are not interchangeable.

## 2. Discover the built-in job and worker

Send `GET /jobs/scheduled`. Find `job: "lead-stage-sla"` and inspect `enabled`, `inUse`, `queued`, `intervalMinutes`, `timezone`, `nextRun` and `lastRun`. Enabled is the setting; inUse indicates relevant data; queued indicates the schedule is enqueued. None alone proves the task exists.

![Actual API discovery with the registered job and queue state](/videos/appengine-background-jobs-usecase/production/requests/setup/qa/cue-0.png)

Hosted AppEngine supplies its worker. Self-hosted AppEngine needs its normal database and Redis connections plus at least one functioning worker with `ENABLE_SYNC=true`. `GET /sync` reports the exposed worker setting and queue names; the actual scheduled run and saved target later in this course verify operation. A browser interval is not a replacement. If a date passes without a result, inspect worker health, exact queued entry, run errors and target—not only whether your client stayed open.

## 3. Create an owned practice pipeline and lead

Create the practice pipeline with `POST /crm/leads/pipelines`:

```json
{
  "name": "my-job-course Follow-up",
  "isDefault": false,
  "stages": [
    {"id":"new","name":"New enquiry","order":0},
    {"id":"contacted","name":"Contacted","order":1},
    {"id":"followup","name":"Follow-up ready","order":2}
  ]
}
```

Read the returned `sk` and keep it as `PIPELINE_ID`. The stage identifier is `contacted`, not the visible caption. Create the lead through `POST /crm/leads/detail`, which applies AppEngine placement rules:

```json
{
  "name":"my-job-course-rowan",
  "fullName":"Rowan Bennett",
  "pipelineId":"YOUR_RETURNED_PIPELINE_ID",
  "stageId":"contacted",
  "source":"other",
  "status":"new"
}
```

Save its returned `sk` as `LEAD_ID`. This fixture deliberately leaves ownership unassigned and sends no notification. If the real workflow needs an owner, use the normal lead update/assignment API to set `assignedTo` to the intended valid staff member; a task assignment alone is not email-delivery proof. Do not use the platform-root-only legacy SLA sweep route; this course uses the staff scheduled-job API.

## 4. Save the stage rule and prepare its clock

Send `PUT /crm/leads/pipelines/stages/PIPELINE_ID/contacted`:

```json
{"sla":{"duration":24,"action":"create_task"}}
```

![Complete stage-rule JSON, with the hours and action highlighted](/videos/appengine-background-jobs-usecase/production/requests/rule/qa/cue-17.5.png)

Duration is measured in hours. A normal move into a stage sets `stageChangedAt`. To rehearse without waiting a day, **only on the owned practice lead**, use `POST /repository/update-partial/lead/LEAD_ID` with `{"data.stageChangedAt":"AN_ISO_TIMESTAMP_25_HOURS_AGO"}`. The bundled `age-practice-lead` operation calculates a fresh value. Do not copy the historical recording date, and do not rewrite production history to force a result.

## 5. Execute the registered job

Send `POST /jobs/scheduled/lead-stage-sla/run` with `{}`. This invokes the built-in implementation for the current organization; it does not upload arbitrary application code.

In the actual demonstration, the returned result was `ok:true`, with one processed lead, one breach, and `actions.create_task:1`. Save `result.jobId` as `JOB_ID`, then `GET /jobs/JOB_ID`. Read its status and handler-specific result. The general `progress.created` field remains zero for this handler; it is not the count of follow-up tasks.

## 6. Read the useful result and check repetition

Read `GET /crm/leads/detail/LEAD_ID`. Its `slaBreachedFor` is `contacted`, and `slaBreachedAt` records when the action was handled. Then search the actual tasks:

```http
POST /repository/search/task
```

```json
{
  "query":{"data.relatedTo.id":"YOUR_LEAD_ID","data.source":"lead-sla"},
  "options":{"page":1,"pageSize":20}
}
```

The actual query returned one saved task, with title `Chase Rowan Bennett — stalled in Contacted`, reason `No movement in Contacted for24h`, a due date and `relatedTo` pointing to the original lead. Run the job again and repeat the query: the second scan processed zero leads, and there was still exactly one task. Do not claim duplicate prevention from a successful response without this second readback.

![Actual expanded saved task in Studio](/videos/appengine-background-jobs-usecase/production/capture/task-expanded.png)

In Studio, open Database → Data Explorer, choose Task, search the title and open the record. Expand the dialog before reading its fields. The name/title and explanation are saved data, not an illustrative success notification.

## 7. Change when it scans and observe an automatic run

Read and preserve your settings before changing them. `PUT /jobs/scheduled/lead-stage-sla` with `{"enabled":false}` pauses future executions while retaining the plan. It does not undo a task, and Run now remains available.

For our controlled rehearsal we set `{"enabled":true,"intervalMinutes":1}`, with one fresh overdue lead, Avery Singh. The threshold stayed24hours. We waited for the worker; we did not issue Run now. The resulting job recorded `trigger:"schedule"` and the task query returned Avery's linked saved task. After the proof, the original60minute plan and inherited timezone were restored.

![Actual worker-created task, with its stored lead relationship](/videos/appengine-background-jobs-usecase/production/requests/automatic/qa/cue-0.png)

Use allowed interval values from the current API rather than arbitrary numbers. A daily job uses its `time` in24hour `HH:mm` form and a named `timezone`; a custom cron schedule puts its timezone inside `cron`. This use case's interval is not a daily clock. The completed [Scheduling and Sync APIs](../../appengine-sync-scheduled-jobs/course/review.html) course demonstrates [bounded cron/timezone/end handling at5:25](../../appengine-sync-scheduled-jobs/course/course.mp4#t=325.566), [both boundary actions at3:36](../../appengine-sync-scheduled-jobs/course/course.mp4#t=216.266), and [stop/reschedule/start at4:11](../../appengine-sync-scheduled-jobs/course/course.mp4#t=251.766). Choose the timezone whose calendar you mean; review the actual `nextRun` around daylight-saving transitions instead of treating a local clock label as a UTC instant.

## 8. Diagnose whole-run and item failures separately

A deliberately malformed `stages` value in our isolated practice pipeline caused a genuine whole-run failure. The saved job had `status:"failed"` and `error:"stages.filter is not a function"`. The fixture was restored immediately. This is recovery evidence, not a recommended way to configure a pipeline.

![Actual failed run and its error in Studio Jobs](/videos/appengine-background-jobs-usecase/production/capture/jobs-failure.png)

A second controlled test supplied an invalid stage without a usable ID. The run could finish `done` but retain failed counts and item errors. Inspect `result.failed`, `errors[]` and the actual affected records as well as overall status. A filter for `status=failed` alone misses these completed scans with failures.

A real product limitation also appeared: two separate leads with the same full name in the same stage produced the same generated task name. The second task creation failed. The failed lead's breach stamp was restored, so it could be considered later, but retries alone could not resolve the naming conflict. **Do not change real customer names as a workaround.** Resolve task naming through the application or choose a suitable alternative rule for that workflow, then verify its outcome. The demo uses distinct people for independent exercises; it does not claim the limitation disappeared.

## 9. Repair, retry and verify the new run

Restore the malformed pipeline's `data.stages` to its valid stage array. Then send `POST /jobs/FAILED_JOB_ID/retry` with `{}`. Keep the **new** response `sk`. It may initially be running; poll `GET /jobs/NEW_JOB_ID` until done, failed or cancelled. `data.retryOf` links back to the earlier failed job.

The actual retry reached done and created the task for the waiting recovery lead. The previous failure remains in history. For an item failure inside a **done** run, correct the cause and run the registered job again: the retry endpoint only accepts failed/cancelled runs. This handler restores the stamp after a thrown action error. Do not assume every action in every job is rollback-safe or idempotent.

![Actual successful retry details in Studio](/videos/appengine-background-jobs-usecase/production/capture/jobs-retry.png)

Studio's Jobs page offers Active/Done/Failed/Cancelled/All and a job-kind filter. Open the precise record. Its current header broadly says the requester is emailed, but these scheduled-job records explicitly have notification delivery disabled; the details correctly say nothing was sent. Follow the record, not that blanket header claim.

## 10. Use stage movement or notification alternatives deliberately

Set the same rule's action to `auto_move` for a fresh practice lead. The job chooses the next stage with greater order and uses the ordinary lead update rules. In this demonstration the reread lead's `stageId` became `followup`; the destination was verified, not inferred from `actions.auto_move`.

A blocked stage move can fall back to owner notification. A final stage has no next destination. These cases can still count as handled, so always read the lead's actual stage. `notify` sends to the owner; `escalate` resolves a manager or pipeline owner fallback. They require a valid recipient and configured delivery channel. This course demonstrates task creation and stage movement; **it does not claim email delivery was tested**. The exact source and tested boundaries are recorded in the QA notes.

## 11. Create and cancel an exact custom schedule

When no built-in job fits, use a supported schedule action and a precise target. It is not a generic way to send arbitrary code to the server. The video creates an owned marker in the already defined `schedule_marks_1010` collection. In your own organization, create an equivalent custom collection with text fields `reference` and `status`, following [Database and Repository APIs: define a custom collection,3:32](../../appengine-data-records/course/course.mp4#t=212.233), then substitute its actual datatype and returned record ID.

The request to `POST /repository/create` has `datatype:"schedule"`, `isNew:true`, and this `data` object:

```json
{
  "name":"my-job-course-release",
  "title":"One-time follow-up preparation",
  "type":"simple",
  "status":"active",
  "target":[{"datatype":"YOUR_MARKER_DATATYPE","id":"YOUR_MARKER_ID"}],
  "start":{
    "date":"YOUR_FUTURE_ISO_TIMESTAMP",
    "action":"update-status",
    "actionArgs":"ready"
  }
}
```

Read `GET /queue-manager/org-schedules` and identify this exact schedule's queue entry. Send its full entry ID to `POST /schedule-control/cancel-job` as `{"jobId":"EXACT_QUEUE_ENTRY_ID"}`. The ID includes the boundary suffix; it is not just the schedule record ID. In the actual readback, the schedule was cancelled and the marker remained waiting. No global queue controls were used.

![Complete custom-schedule request with its target and future boundary](/videos/appengine-background-jobs-usecase/production/requests/custom/qa/cue-15.31.png)

**Running-handler limitation:** the current lead SLA implementation does not call the cooperative cancellation check between items. Do not promise that a Cancel click stops this handler mid-scan. Pause prevents future scans; cancellation of a queued custom entry prevents that entry; neither rolls back earlier record changes.

## Completion and source examples

The practical acceptance check is a complete chain: valid stage rule → queued plan → real scheduled job → task or stage change linked to the intended lead → inspectable error and new recovery run where needed. This course verified manual and scheduled execution, duplicate prevention, full failure and retry, partial errors, actual stage movement and exact custom cancellation. The practice SLA was disabled afterward, original recurring timing restored, and the custom future schedule cancelled. Existing unrelated data was not removed.

[Download all examples](scheduled-jobs-examples.zip). The package contains runnable JavaScript, TypeScript and standard-library Python; curl shell helper; Postman collection; complete JSON operation bodies; and sanitized observed API evidence. JavaScript exercised the complete workflow; all three executable clients passed authenticated read-only discovery. Postman/curl are equivalent contract examples, not claims of independent full replays. Setup, expected results, write flags and known limitations are in the included README.

Current source basis: AppEngine `src/crm/lead-sla.job.ts`, `src/crm/leads.controller.ts`, `src/crm/leads.service.ts`, `src/scheduled-jobs/scheduled-jobs.service.ts`, `src/scheduled-jobs/scheduled-jobs.controller.ts`, `src/jobs/jobs.controller.ts`, and the schedule consumer. No application-source changes were made for this production.
