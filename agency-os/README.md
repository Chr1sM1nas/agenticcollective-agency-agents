# Agentic Agency OS: Agency Zero (MVP v0.2)

A local, single-user proof of one executable workflow:

```text
Client Brief -> Agency Director -> Research -> Strategy -> Critic
                                                    ^       |
                                                    | REVISE|
                                                    +-------+
                                                   up to twice
Quality threshold reached OR review limit -> Human Approval -> Approved Result
```

All existing agent definitions and applications remain unchanged. Agents are the workforce; this application supplies execution, handoffs, persistence and gates. This is not the full Agency OS.

## Run Locally

Requires Node.js 22 or later, npm, Docker with Compose (or an existing PostgreSQL 16+ instance), and an OpenAI API key with access to a model supporting Chat Completions JSON mode.

From the repository root:

```sh
cd agency-os
npm ci
docker compose up -d --wait
cp .env.example .env
```

Set `OPENAI_API_KEY` in the local `.env` using your editor. The file is ignored by Git. Never put credentials in the dashboard, committed files, agent prompts or test output. The sample `DATABASE_URL` matches the local Compose database. Its password is for isolated local development only.

Then:

```sh
npm run db:migrate
npm run dev
```

Open **http://localhost:3100**. Click **Load Test Brief**, then **RUN AGENCY**. The test brief is the exact Agentic Collective go-to-market brief supplied for this milestone. When Critic passes, review the output and choose **APPROVE**, **REQUEST CHANGES** (feedback required), or **REJECT**. Only an approved result can be downloaded. Nothing is sent or externally published.

If `3100` is occupied, set another `PORT` in `.env`. The server binds to `127.0.0.1`. Use a private forwarded port in Codespaces. Without an API key the dashboard still opens, shows a configuration warning, and disables execution. Restart the server after changing credentials or model settings.

For a compiled run:

```sh
npm run build
npm start
```

Run commands from `agency-os`; prompts, assets and the parent agent library resolve relative to that directory. `AGENT_LIBRARY_ROOT` optionally sets another repository root.

## Workflow Rules

- The Director is a new OS prompt. It interprets the brief, selects Research and Strategy agents from dynamically loaded registry metadata, and returns a validated task plan.
- The registry recursively reads approved existing agent folders. Stable IDs are repository-relative paths. Invalid YAML is reported and skipped, not repaired in the source library. Currently the ZK Steward definition has invalid frontmatter.
- The Director chooses appropriate agents per brief. For the milestone fixture, Research uses Trend Researcher and Strategy uses Growth Hacker. Live model selection is not hard-coded to those choices.
- Selected Markdown is loaded into each specialist's prompt; persona contents are never embedded in application source. Tool suggestions and persona metrics do not grant tools or constitute evidence.
- Research is offline. Supplied facts include an exact quotation and source brief field, checked against the submitted text. Assumptions and observations are labeled inference; source checks do not prove factual entailment.
- Strategy receives the original brief and complete validated research. A revision also receives its prior strategy and all Critic scores and feedback. Persisted inputs prove these handoffs.
- The Critic receives the original brief, Director plan, complete research and current strategy. Application code computes the equal-weight mean of six scores without rounding into PASS. `QUALITY_THRESHOLD` defaults to **8.5**; `MAX_CRITIC_ITERATIONS` defaults to **3**, including the initial Critic review. Configure these in `.env` and restart; the review limit must be an integer from 1 to 3. Invalid settings stop startup. Each new run snapshots its policy, so changing configuration cannot reinterpret existing runs.
- Below-threshold scores deterministically produce REVISE and trigger Strategy revision while reviews remain. Revision receives the original brief, plan, full research, previous strategy, complete Critic feedback, accumulated evidence requirements, iteration number and triggering evaluation/score/threshold. Every Strategy and Critic version is retained, with separate agent executions and telemetry.
- A PASS stops revision immediately. After the final permitted below-threshold review, the verdict remains REVISE, but the latest reviewed strategy is still assembled for mandatory human review. Its status is **MAX ITERATIONS REACHED - HUMAN REVIEW REQUIRED**, not PASS or human approval.
- Final output records the latest strategy and evaluation IDs, final score, threshold, number of iterations, AI quality status and unresolved evidence requirements. The dashboard shows expandable iteration history and concise agent-generated "What Changed" notes.
- Missing evidence is not repaired by fabrication. Strategy is instructed to remove/soften unsupported claims or flag validation needs. Evidence requirements from all iterations and unsupported claims remain visible even if later wording removes them. No external research or automated proof of claim truth is added.
- The Director's orchestration assembles the final recommendation without another model call. AI quality is separate from human approval: APPROVE, REQUEST CHANGES or REJECT must be explicitly chosen by the human, even after PASS or exhausted revisions. Approval references the exact final artifact and its evaluation.
- REQUEST CHANGES stores feedback and pauses at `changes_requested`. It does not restart agents or bypass the automatic revision limit. Update the brief/context and submit a new workflow to incorporate the feedback. REJECT is terminal.
- One worker processes workflows sequentially. Database queue claims are transactional; a schema-scoped advisory lock prevents duplicate workers. All model calls have automatic SDK retries disabled.
- After an interrupted execution, startup marks running work failed rather than silently replaying paid calls. Queued briefs remain queued; review history is retained. Submit a new brief to retry a failed execution.

## Provider and Telemetry

`ModelProvider` is a provider-neutral generation interface. `ModelRouter` returns the configured default provider; only OpenAI is implemented for this milestone. Claude, Gemini and Ollama are not included yet.

`OPENAI_MODEL` configures the default model centrally; the default is `gpt-4.1-mini`. Each AgentRun records the provider-returned model identifier, elapsed time, token counts and available cost estimate. Usage is also retained for invalid or incomplete responses when the provider supplies it.

Set both `OPENAI_INPUT_USD_PER_MILLION` and `OPENAI_OUTPUT_USD_PER_MILLION` from current pricing for the chosen model to enable estimated USD cost. Otherwise cost is `null`/unavailable, not falsely reported as free. The estimate is based on input/output token rates, not billing reconciliation or discounted cached-token accounting.

`MAX_OUTPUT_TOKENS` defaults to 6000; `MAX_INPUT_CHARS` defaults to 200000. Complete handoffs are never silently summarized or truncated. An oversized context, malformed JSON, refused output, provider error or invalid schema stops the workflow with a persisted error. The character guard is not an exact token counter; provider context limits still apply.

## PostgreSQL

The versioned SQL migration seeds **Agency: Agentic Collective** and **Deployment: Agency Zero**. Tables store Agency, Deployment, Client, Project, WorkflowRun, Task, AgentRun, Artifact, Evaluation and Approval. Approval includes human feedback and the local actor. Artifact versions preserve strategy revisions and their evaluations; prompts and inputs are recorded with each AgentRun.

Migration and storage use parameterized `pg` queries and transactions. Run `npm run db:migrate` before starting v0.2 on an existing database. Migration **2** expands attempt constraints to three, stores each run's quality policy, and records each evaluation's threshold. Historical evaluations retain their original 7.5 threshold, verdicts and human approvals; existing pending v0.1 human reviews remain actionable. Previously failed or `needs_review` runs are not automatically restarted. Both migrations are applied transactionally and idempotently. No Redis, vector database, external queue or ORM is required. Compose uses a persistent Docker volume; `docker compose down` stops it without removing its data.

Useful inspection:

```sh
docker compose exec postgres psql -U agency -d agency_zero -c 'SELECT id, status, created_at FROM workflow_runs ORDER BY created_at DESC;'
docker compose exec postgres psql -U agency -d agency_zero -c 'SELECT stage, status, attempt FROM tasks ORDER BY workflow_run_id, position;'
docker compose exec postgres psql -U agency -d agency_zero -c 'SELECT provider, model, duration_ms, input_tokens, output_tokens, estimated_cost_usd FROM agent_runs;'
docker compose exec postgres psql -U agency -d agency_zero -c 'SELECT verdict, overall_score, scores FROM evaluations;'
docker compose exec postgres psql -U agency -d agency_zero -c 'SELECT decision, feedback, artifact_id FROM approvals;'
```

## Tests

```sh
npm run typecheck
npm test
TEST_DATABASE_URL=postgresql://agency:agency_local@127.0.0.1:55432/agency_zero npm run test:integration
npx playwright install chromium
TEST_DATABASE_URL=postgresql://agency:agency_local@127.0.0.1:55432/agency_zero npm run test:browser
```

Without `TEST_DATABASE_URL`, database tests are explicitly skipped. Browser tests additionally require `RUN_BROWSER_TESTS=1`, which `test:browser` sets. Database tests create unique schemas and delete those schemas after testing; they do not remove normal application projects. Prefer a dedicated test database when connecting to anything other than the local instance.

The current dev container lacks Chromium system libraries. The browser test was successfully run without changing host packages using the official Playwright image. From `agency-os`, this reproduces it on Linux:

```sh
docker run --rm --network host --ipc=host \
  -v "$(dirname "$PWD")":/work -w /work/agency-os \
  -e TEST_DATABASE_URL=postgresql://agency:agency_local@127.0.0.1:55432/agency_zero \
  -e RUN_BROWSER_TESTS=1 \
  mcr.microsoft.com/playwright:v1.63.0-noble \
  npx tsx --test tests/browser.test.ts
```

Match the image version to the installed Playwright version if dependencies change.

The model in integration/browser tests is an explicitly injected deterministic fixture, not an OpenAI response. Production has no fixture-provider environment switch. Browser screenshots and the fixture report are generated under ignored `test-results/`.

For a **live** test, start the normally configured server, then run in another terminal:

```sh
npm run test:live
```

This submits the exact milestone brief, persists a real model workflow in the application database, checks version history and deterministic quality verdicts, prints actual model/usage/evaluations, and writes `test-results/live-run.json`. It never approves automatically. Complete the human decision in the dashboard. `AGENCY_OS_URL` can override the default local server address. Missing credentials fail clearly without substituting sample outputs.

The approved JSON download includes the original brief, Director plan, research, every strategy and Critic artifact, all evaluations, final quality/evidence status, human decision and feedback, and agent runs with full inputs, prompt snapshots, timestamps and telemetry. It never includes server environment variables or the API key. Iteration failures retain completed artifacts and prevent final assembly/approval; no failed Critic review is treated as a completed quality cycle.

## Scope and Limitations

This is a localhost-only, trusted single-user pilot, **not a production multi-user service**. It has same-origin write checks and a restrictive content security policy but no application login or tenant isolation. Keep forwarded ports private. Do not expose it publicly or use sensitive client data without adding authentication, access control and an agreed data policy.

There is no live web research, Creative, Proposal, Nightly Reflex, autonomous code modification, external tool execution, email, social publishing, payments or deployment automation. Critic PASS is a model-assisted quality judgment, not verification that the commercial claims are true.

See [VALIDATION.md](VALIDATION.md) for validation results and the historical v0.1 milestone record.

## Created Files

```text
agency-os/
  .env.example
  .gitignore
  package.json
  package-lock.json
  tsconfig.json
  compose.yaml
  README.md
  VALIDATION.md
  api/app.ts
  api/server.ts
  app/index.html
  app/client.ts
  app/style.css
  core/contracts.ts
  core/director.md
  core/model-router.ts
  core/quality.ts
  core/registry.ts
  core/worker.ts
  core/workflow.ts
  database/schema.sql
  database/quality-loop.sql
  database/migrate.ts
  database/store.ts
  evaluation/critic.md
  runtime/openai.ts
  workflows/test-brief.ts
  scripts/test-live.ts
  tests/contracts.test.ts
  tests/fixtures.ts
  tests/integration.test.ts
  tests/provider.test.ts
  tests/browser.test.ts
```