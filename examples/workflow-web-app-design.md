# Multi-Agent Workflow: Web App Product Design

> Design a new web app product end-to-end — from raw idea to PRD and first build — using a coordinated team of specialist agents.

## The Scenario

You have an idea for a web app product but need to turn it into something concrete: a clear product definition, competitive positioning, user flows, a scoped MVP, and a PRD that design and engineering can act on immediately. This workflow also kicks off the first build sprint.

## Agent Team

| Agent | Role in this workflow |
|-------|---------------------|
| Web App Designer | Define product vision, users, flows, MVP scope, and PRD |
| Trend Researcher | Validate market opportunity and competitive landscape |
| UX Architect | Design detailed user experience flows and information architecture |
| UI Designer | Create visual design system and component specifications |
| Backend Architect | Design API, data model, and system architecture |
| Frontend Developer | Build the first working version of the app |
| Sprint Prioritizer | Translate PRD into an actionable sprint plan |

---

## The Workflow

### Stage 1: Product Definition

**Step 1 — Activate Web App Designer**

Start here with your raw idea. The Web App Designer will ask discovery questions, define users, scope the MVP, and produce the PRD.

```
Activate Web App Designer.

I want to build a web app. Here's my idea:
[Describe your product idea in 1–3 sentences. Don't worry about being vague — the agent will ask clarifying questions.]

Please run through your full discovery process:
1. Ask me any clarifying questions about the problem, users, and market
2. Draft a vision statement
3. Build the primary user persona
4. Define the MVP scope using MoSCoW
5. Produce a full PRD with user stories and acceptance criteria
6. Define success metrics and analytics events to track

Output: Full PRD document ready for design and engineering handoff.
```

**Step 2 — Activate Trend Researcher (in parallel with Step 1)**

While the Web App Designer works on the PRD, the Trend Researcher validates the market.

```
Activate Trend Researcher.

I'm designing a new web app: [paste your product idea in 1–2 sentences].

Please research and deliver:
1. Market size estimate (TAM/SAM/SOM) with sources
2. Top 5 competitors with feature comparison and positioning
3. 3 emerging trends that create tailwind for this product
4. 2–3 risks or headwinds (regulatory, market saturation, timing)
5. Recommended go-to-market angle based on competitive gaps

Output: A 2-page market brief with competitive positioning recommendation.
```

---

### Stage 2: Experience Design

**Step 3 — Activate UX Architect**

Feed both the PRD and the market brief to the UX Architect.

```
Activate UX Architect.

We're designing [Product Name] — [one-sentence product description].

Here is our PRD: [paste Web App Designer output]
Here is our market brief: [paste Trend Researcher output]

Please design:
1. Full sitemap (all pages and sections)
2. Detailed user flow for the activation / onboarding sequence (new user to first value moment)
3. User flows for the top 3 core features in the PRD
4. Navigation architecture and information hierarchy
5. Error states and edge cases for each core flow
6. Wireframe descriptions (text-based) for the 3 most complex screens

Output: UX specification document ready for visual design.
```

**Step 4 — Activate UI Designer**

Feed the UX spec to the UI Designer to create the visual design system.

```
Activate UI Designer.

We're building [Product Name] — [one-sentence product description].
Target users: [paste persona summary from PRD].
Design tone: [e.g., "clean and professional", "playful and approachable", "bold and technical"].

Here is our UX specification: [paste UX Architect output]

Please deliver:
1. Color palette (primary, secondary, semantic colors) with hex values and WCAG contrast ratios
2. Typography system (font pairing, size scale, weights)
3. Spacing and grid system
4. Core component specifications:
   - Navigation / header
   - Hero / CTA section (if landing page included)
   - Primary action button variants
   - Form inputs and validation states
   - Cards and list items
   - Modal / dialog
   - Empty states
   - Loading / skeleton states
5. Dark mode token overrides
6. Mobile responsive breakpoint strategy

Output: Design system specification ready for developer implementation.
```

---

### Stage 3: Technical Architecture

**Step 5 — Activate Backend Architect**

Feed the PRD and UX spec to the Backend Architect.

```
Activate Backend Architect.

We're building [Product Name]. Here are the requirements:

PRD: [paste Web App Designer output]
UX Flows: [paste UX Architect output]

Please design:
1. Database schema (tables, relationships, indexes) — prefer PostgreSQL
2. REST API endpoint list (method, path, request/response shape, auth requirement)
3. Authentication strategy (recommend JWT vs. sessions vs. OAuth)
4. Real-time requirements (do any features need WebSockets or SSE? If so, specify events)
5. Third-party integrations needed (email, payments, storage, etc.)
6. Deployment architecture recommendation (include estimated costs at launch scale)
7. Security considerations (OWASP Top 10 relevant to this app)

Stack assumption: Node.js + TypeScript backend unless otherwise specified.

Output: Full technical specification ready for implementation.
```

---

### Stage 4: Sprint Planning

**Step 6 — Activate Sprint Prioritizer**

Combine all outputs to create an executable sprint plan.

```
Activate Sprint Prioritizer.

We're ready to build [Product Name]. Here are all our specs:

PRD: [paste]
UX Specification: [paste]
Design System: [paste]
Technical Specification: [paste]

Timeline: [X weeks] to MVP launch.
Team: [describe team — e.g., "1 frontend dev, 1 backend dev, part-time designer"].

Please:
1. Break the MVP into weekly sprints with clear deliverables and acceptance criteria
2. Identify cross-team dependencies and flag sequencing requirements
3. Apply RICE scoring to features that don't fit in the MVP sprint window
4. Define the Definition of Done for each sprint
5. Flag the top 3 technical risks and recommend mitigation strategies

Output: Sprint plan with weekly milestones, ready for team kickoff.
```

---

### Stage 5: First Build

**Step 7 — Activate Frontend Developer**

```
Activate Frontend Developer.

Build [Product Name] frontend based on these specifications:

Design System: [paste UI Designer output]
UX Flows: [paste UX Architect output]
API Spec: [paste Backend Architect output — focus on endpoints the frontend needs]
Sprint Plan: [paste Sprint 1 scope from Sprint Prioritizer output]

Stack: React + TypeScript + Tailwind CSS.

For Sprint 1, deliver:
1. Project scaffolding (Vite or Next.js, configured with Tailwind and TypeScript)
2. Design token CSS variables from the design system
3. Core component library (Button, Input, Card, Modal, Layout)
4. [Core feature screen 1] — fully functional with mock data
5. [Core feature screen 2] — fully functional with mock data
6. Routing setup for all MVP pages
7. Responsive mobile layout for all components

Output: Working Next.js app with Sprint 1 features complete.
```

---

## Key Patterns

1. **Parallel kickoff**: Steps 1 and 2 (Web App Designer + Trend Researcher) can run simultaneously since they don't depend on each other.
2. **Sequential dependency chain**: Steps 3 → 4 → 5 → 6 build on each other. Always feed previous outputs forward.
3. **Always paste full outputs**: Agents don't share memory. Copy the complete output from one step into the next prompt — don't summarize.
4. **PRD is the source of truth**: If you change the PRD, re-feed it to any downstream agent that was given an older version.
5. **Sprint Prioritizer as a quality gate**: Before handing off to engineers, the Sprint Prioritizer ensures the plan is achievable and risks are identified.

---

## Condensed Quick-Start Version

If you want to move fast and don't need the full workflow, use just 3 agents:

```
Step 1: Web App Designer → Full PRD + MVP scope
Step 2: UI Designer → Design system + component specs
Step 3: Frontend Developer → Working MVP prototype
```

This gets you from idea to working prototype in a single day.

---

## Tips

- Keep your initial product brief short (2–3 sentences) and let the Web App Designer ask discovery questions — answering those questions produces better output than trying to write a detailed brief upfront.
- Run the Trend Researcher in parallel with the Web App Designer and use the market brief to pressure-test the PRD before finalizing it.
- The UI Designer's output improves significantly when you provide a tone/aesthetic reference (e.g., "Notion-like", "Stripe-like", "playful like Linear").
- If the Sprint Prioritizer flags that the MVP scope is too large, loop back to the Web App Designer with the feedback to tighten the scope before starting the build.
