# Agency Zero Validation

Date: 2026-10-06.

## MVP v0.2: Automatic Critic Revision Loop

The existing architecture was extended, not replaced. Migration 2 is applied to the application database; legacy evaluations keep their original threshold and pending legacy human reviews remain actionable.

Validation:

- TypeScript typecheck and browser/server build: passed.
- Unit, provider, API and isolated PostgreSQL checks: **29 passed**. Two browser cases were explicitly skipped in that invocation and run separately.
- Chromium fixture dashboard tests in the existing Playwright image: **2 passed**, covering both an eventual PASS and exhausted below-threshold revisions. Tests exercise desktop/mobile, expandable iteration history, unresolved evidence, all three human decisions, and approved JSON downloads containing every version, evaluation and agent run.
- Migration upgrade/idempotency: passed, including approval of a preserved legacy 8.33 PASS under its original 7.5 threshold.
- Failed revision/failed Critic preservation, complete revision inputs, deterministic threshold boundary, three-review cap, configured policy snapshots, evidence retention and mandatory human approval: passed.
- No framework or dependency changes. Existing agent library definitions remain unchanged.

### Live OpenAI Test

The exact Agentic Collective test brief was executed against the application PostgreSQL database using `openai / gpt-4.1-mini-2025-04-14`. Director selected Trend Researcher and Growth Hacker.

Run ID: `3a08d549-2675-45bf-9f13-64485067ff1e`.

| Iteration | Overall score | Threshold | Deterministic verdict |
| --- | ---: | ---: | --- |
| 1 | 7.833333333333333 | 8.5 | REVISE |
| 2 | 7.666666666666667 | 8.5 | REVISE |
| 3 | 8.166666666666666 | 8.5 | REVISE |

Final AI quality status: **MAX ITERATIONS REACHED - HUMAN REVIEW REQUIRED**.

Workflow status: **awaiting_approval**. Human decisions recorded: **0**. The final artifact references Strategy v3 and Critic v3's evaluation. All eight agent executions, three Strategy artifacts, three Critic artifacts and three evaluations are retained. Usage was 24,365 input tokens and 5,456 output tokens. Estimated USD cost is unavailable (`null`) because provider prices are not configured.

The live dashboard was additionally checked in real Chromium at desktop 1440x1000 and mobile 390x844: three expandable iterations, final score 8.17, outstanding evidence, visible human approval controls, hidden approved download, no horizontal overflow and no browser JavaScript errors. No approval was submitted.

Reports and screenshots are in ignored `test-results/live-run.json`, `test-results/live-result-desktop.png` and `test-results/live-result-mobile.png`; workflow records remain in PostgreSQL.

An initial live attempt (`c2f1b8d7-da4e-4846-b349-38ef2b024a91`) stopped on invalid Strategy `whatChanged` output. Completed Director/Research artifacts and failure telemetry were preserved, with no approval. The Strategy prompt was clarified to require JSON arrays and `[]` for initial change notes; strict validation was retained and a format regression test was added before the successful rerun.

### Remaining Limitations

- Missing external evidence cannot be supplied by offline revision. The final live result conservatively retains 28 evidence/validation entries. Exact duplicate strings are deduplicated, but similar differently worded requirements may remain.
- Prompts require evidence discipline and the Critic challenges unsupported claims; neither validates real-world facts or guarantees that a model cannot hallucinate.
- Revision does not guarantee monotonically improving scores, as the live second review demonstrates.
- Human REQUEST CHANGES records feedback but does not start another automatic revision.
- The original invalid ZK Steward frontmatter warning remains unrelated to this feature.
- The API key remains server-side in the ignored environment file; no browser configuration, downloaded workflow record or prompt receives it.
- Direct Chromium launch still lacks host libraries; existing Docker browser tooling was used without installing host dependencies.

## Historical v0.1 Milestone Record

The following is the original milestone record, not the current v0.2 behavior or live verification status.

### Result

The first executable workflow is implemented and tested with real PostgreSQL and a real Chromium dashboard. A genuine OpenAI run is **not verified**: no `OPENAI_API_KEY` was available in the environment. No generated business response, score or token usage below should be mistaken for a live model result.

- TypeScript typecheck and browser/server build: passed.
- Unit, provider-transport, API and PostgreSQL workflow checks: 21 passed; browser check explicitly skipped in that invocation and then run separately.
- Chromium dashboard check: 1 passed separately. Desktop 1440x1000 and mobile 390x844 were exercised; mobile had no horizontal overflow and there were no browser JavaScript errors.
- Dependency audit: zero vulnerabilities.
- Existing agent library and applications: unchanged. All created source/configuration files are under `agency-os`; the README includes the full inventory.

### Executed Workflow

Using an explicitly injected test-only provider and the exact supplied client brief:

```text
Director -> Trend Researcher -> Growth Hacker -> Critic REVISE (6.0)
                                  ^                  |
                                  +-- one revision --+
Growth Hacker revision -> Critic PASS (8.333333333333334)
                       -> Human approval -> persisted APPROVE
```

Research and Strategy definitions were dynamically loaded from the original repository:

- [Trend Researcher](../product/product-trend-researcher.md)
- [Growth Hacker](../marketing/marketing-growth-hacker.md)

Both full research handoffs and revision feedback were asserted in actual persisted AgentRun inputs. Other tests confirmed first-pass success, blocking after a second REVISE, failure persistence, invalid selection, malformed output, fabricated source quotations, approval gates, requested changes, rejection, and interrupted-run recovery. Browser testing clicked all three human decision buttons and reloaded an approved run from PostgreSQL.

### Test Brief Result

The fixture recommendation, authored only to exercise the workflow, was:

> Agentic Collective helps digital agencies become AI-native without surrendering leadership control: begin with one governed workflow, baseline its economics, and prove faster delivery, reusable knowledge and capacity gains before expanding.

Its approach measured outputs per staff-hour, brief-to-approval time, labour/rework cost and knowledge reuse. This is **sample test data**, not a researched or model-validated commercial proposition.

Final fixture scores:

| Dimension | Score |
| --- | ---: |
| Relevance | 9 |
| Evidence | 8 |
| Strategic quality | 8 |
| Originality | 8 |
| Commercial value | 8 |
| Clarity | 9 |
| Overall | 8.333333333333334 |

Fixture provider/model: `fixture / deterministic-test-only`. Actual LLM token usage and cost: unavailable; recorded as `null`. The OpenAI adapter was separately tested with mocked HTTP responses for configured model selection, complete inputs, usage/cost extraction, sanitized failures, context limits and incomplete responses. Those mock values are not actual expenditure.

### Errors and Limitations

- Live model selection, live quality and live usage remain unverified until an OpenAI key is configured and the exact brief is executed.
- One original agent has malformed YAML frontmatter. It is skipped with a visible registry warning; its definition was not modified.
- Chromium could not launch directly in this container because of missing system libraries. The browser check passed in the official Playwright Docker image.
- The initial browser-container attempt omitted the parent agent library. Mounting the full repository resolved it. Isolated schemas abandoned by those setup failures were removed; normal application data was not removed.
- Initial dependency audit findings and an API-handler TypeScript error were repaired; subsequent build, tests and audit passed.
- Human change requests are recorded and pause execution; they require an explicitly updated/resubmitted brief, not another autonomous revision loop.
- This is a trusted local single-user pilot without application authentication, live web access or production deployment support.

### Live Verification

Follow [README.md](README.md) to configure the environment and start the server. Click **Load Test Brief** and **RUN AGENCY**, or run `npm run test:live` against that server. Review the actual scores and strategy, then approve/request changes/reject in the dashboard. The live test writes its report under `test-results/live-run.json`; workflow records remain in PostgreSQL.

No additional Agency OS workflows were implemented.