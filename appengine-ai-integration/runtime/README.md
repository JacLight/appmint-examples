# AI employee session manager

This course snapshot requires an explicitly configured `AIE_PROVIDER_KEY` in every environment; its original development-key fallback has been removed.

Runs AI employees for appengine. appengine provisions an agent here; the agent signs in to appengine **as its AI employee** — like a person, password then authenticator code — and works its queue. Each job is done in a headless **Claude Code** session that can act only through `./ae`, as the employee.

appengine does not know what runs the agent. It only speaks the provisioning contract below (its `session-manager` provider).

## Run

```sh
npm install
AIE_PROVIDER_KEY=<key appengine will send> node src/server.mjs
```

| Variable | Default | |
|---|---|---|
| `AIE_PORT` | `3400` | |
| `AIE_PROVIDER_KEY` | Required; no bundled default | the bearer key appengine sends — set it anywhere but a laptop |
| `AIE_POLL_MS` | `15000` | how often an idle agent checks its queue |
| `AIE_MODEL` | `sonnet` | model when the employee names none |
| `AIE_CLAUDE_BIN` | `claude` | the Claude Code CLI |

On the appengine side: `AI_EMPLOYEE_SESSION_MANAGER_URL` and `AI_EMPLOYEE_SESSION_MANAGER_KEY` (set the URL to your runtime and configure the same private key on both services). Set an employee's **Who does the work** to *Session manager* and click **Provision** on its page.

## The contract appengine calls

All calls carry `authorization: Bearer <AIE_PROVIDER_KEY>`.

```
GET    /v1/health
GET    /v1/agents
POST   /v1/agents            { orgId, apiBaseUrl, employee: { name, title }, signIn: { email, password, authenticatorSecret }, brief?, model?, start? }
GET    /v1/agents/:id        status, current job, recent log
PUT    /v1/agents/:id        { signIn?, brief?, model?, apiBaseUrl? }
POST   /v1/agents/:id/start
POST   /v1/agents/:id/stop
DELETE /v1/agents/:id
```

Provisioning the same employee again replaces its sign-in and restarts it. `agentId` is `<orgId>--<handle>`.

## What an agent does

1. Signs in as the employee (`profile/user/signin`, then `profile/security/challenge/verify` with a code from its authenticator secret).
2. Says hello (`ai-employees/me/hello`) — appengine shows it **Online** — and reads its briefing (`ai-employees/me/briefing`).
3. Every `AIE_POLL_MS`, leases its next job (`ai-employees/worker/<handle>/lease`). A locked login (not switched on, or paused) just waits.
4. Runs the job in `claude -p` in its own folder (`data/agents/<agentId>`), with its briefing as instructions. The session reads none of this machine's Claude settings, hooks or MCP servers and may run only `./ae`. What it says streams onto the job as `thinking` steps.
5. `./ae approval …` that answers WAIT ends the turn; the job waits for a person in AI Employees › Approvals. When it is leased again with the decision, the **same** session is resumed with the answer.
6. `./ae complete` / `./ae fail` finish the job; the session's cost goes on it.
7. It is never left idle: appengine pings every switched-on employee on a regular interval (a job with `source: ping`). What a ping asks of it comes from the system instructions in its briefing, not from this code; the prompt only states the facts (it is a ping, the time, its other open work). Its own notes and the current time come with the briefing, read fresh for every job.

## `./ae`

The session's only tool, acting as the employee with its token (never its password):

```
./ae step <thinking|note|action|check|screen|error> <text>
./ae approval <delete|bulkSend|money|usersAndPermissions|other> <amountUsd> <what you want to do>
./ae api <METHOD> <path> [json]
./ae conversations | read <id> | say <id> <text>
./ae docs <what you want to do>
./ae guide <docs url>
./ae note <text> | notes            # notes it keeps for itself, on its own user
./ae summary [sinceISO]              # its work since then, counted by the server (reports)
./ae complete <result> | fail <reason>
```

## Data

`data/agents.json` holds each agent's sign-in (file mode 600); `data/agents/<agentId>/` holds its sessions' job folders and `log.txt`. Removing an agent deletes both. `data/` is git-ignored.

## Deploy (a test or production server)

Everything that changes per machine is an environment variable — see `.env.example` (copy it to `.env`; `npm start` reads it).

**On the server**
1. Node 22+ and the Claude Code CLI: `npm i -g @anthropic-ai/claude-code`. Sign it in with your Claude subscription, once: in a container, `kubectl exec -it deploy/ai-employee -- claude` then `/login` (the image keeps the login on the data volume via `CLAUDE_CONFIG_DIR`); or set `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`.
2. `npm ci --omit=dev`, then `cp .env.example .env` and fill in:
   - `AIE_PROVIDER_KEY` — a long random key (`openssl rand -hex 32`). Required when `NODE_ENV=production`.
   - `AIE_DATA_DIR` — a persistent, backed-up folder only this service can read (agents' sign-ins live there).
3. `npm start` (or the `Dockerfile`: mount a volume at `/data`, pass `AIE_PROVIDER_KEY` and `CLAUDE_CODE_OAUTH_TOKEN` as secrets, publish 3400).
4. Check: `curl -H "authorization: Bearer $AIE_PROVIDER_KEY" http://<server>:3400/v1/health`.

**How appengine and this reach each other** — two directions:
- **appengine → session manager** (provision, start, stop, restart, status): appengine calls `AI_EMPLOYEE_SESSION_MANAGER_URL` with `AI_EMPLOYEE_SESSION_MANAGER_KEY` as the bearer key. Set both on appengine; the key must equal `AIE_PROVIDER_KEY` here. Keep port 3400 reachable from appengine only (private network, firewall, or a VPN) — the key is the only guard.
- **session manager → appengine** (each agent signing in, reading its queue, working): the agent uses the API address appengine handed it at provisioning — appengine's `APPENGINE_URL`. So appengine's `APPENGINE_URL` must be reachable from this server (and its chat socket, on the same address).

After changing either address, re-provision each AI employee (its **Connection** tab → Provision) so its agent gets the new details.
