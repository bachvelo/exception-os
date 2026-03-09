# Exception OS Architecture

## System Overview

Exception OS is structured as a presentation layer, orchestration layer, decision engine, and memory layer. The current implementation ships as a deployed SaaS-style web application. Its live collaboration boundary is the user-owned Notion workspace, and its upstream signal ingestion currently combines live GitHub data with live Notion workspace search context.

## Architectural Principles

- Notion is the operational memory and human approval surface.
- Exception detection is hybrid: rules first, model second.
- Every automated recommendation must remain reviewable.
- The system should degrade gracefully into demo mode without external credentials.

## High-Level Components

### 1. Frontend Application

Technology:

- Next.js App Router
- React client component for live dashboard interactions
- Custom CSS design system

Responsibilities:

- Display operational metrics
- Show signals and active exceptions
- Render decision brief details
- Trigger incident simulation
- Handle per-user Notion connection and publishing actions

### 2. API Layer

Endpoints:

- `GET /api/dashboard`: returns the current dashboard snapshot
- `POST /api/simulate`: refreshes the live dashboard snapshot on demand
- `GET /api/notion/status`: returns Notion connection state for the current user session
- `GET /api/notion/connect`: starts the Notion OAuth flow
- `GET /api/notion/callback`: completes the Notion OAuth flow
- `POST /api/notion/sync`: searches the connected Notion workspace
- `POST /api/notion/publish`: publishes a decision brief into Notion

Responsibilities:

- Normalize requests and responses
- Provide a clean seam for future persistence
- Keep simulation state centralized

### 3. Simulation Store

Current state handling no longer depends on a seeded incident store. The dashboard snapshot is built from live source adapters on each request.

Responsibilities:

- Fetch live GitHub signals from the configured repository
- Fetch live operational context from the connected Notion workspace
- Normalize raw source data into dashboard signals

Production replacement:

- Postgres or Supabase for event storage
- Queue and worker for async classification
- Webhook or polling connectors for live source ingestion

### 4. Decision Engine

Responsibilities:

- Score incoming signals
- Determine whether they qualify as exceptions
- Build structured decision briefs
- Recommend owner and next actions

Current implementation:

- Heuristic classification rules based on impact, urgency, and source type

Production evolution:

- Rule engine + LLM reasoning pass
- Notion playbook retrieval via MCP
- Confidence calibration from human feedback

### 5. Notion MCP Adapter

The adapter is an architecture boundary for:

- Reading playbooks and team memory from Notion
- Writing signal records and decision briefs into Notion databases
- Updating approval state and final outcomes

Current implementation status:

- Implemented as a real server-side MCP client
- Uses OAuth 2.0 with PKCE and dynamic client registration
- Stores encrypted session state in HTTP-only cookies
- Publishes decision briefs into a configured Notion parent page or database, or workspace root fallback
- Searches connected workspace context through live MCP tool calls
- Works on a per-user basis so different users can connect different Notion workspaces
- Contributes live workspace-derived signals to the dashboard

### 6. Human Review Loop

In production, an operator would approve or edit a decision inside Notion or the Exception OS UI.

Workflow:

1. Signal arrives
2. Decision engine drafts exception brief
3. Brief is stored in Notion
4. Human approves or edits
5. Outcome is recorded for learning

## Data Model

### Signal

- `id`
- `source`
- `title`
- `summary`
- `severity`
- `impactArea`
- `affectedEntity`
- `receivedAt`

### Exception

- `id`
- `signalId`
- `priority`
- `status`
- `confidence`
- `reason`
- `owner`
- `slaMinutes`

### Decision Brief

- `id`
- `exceptionId`
- `headline`
- `whyNow`
- `likelyCause`
- `recommendedActions`
- `evidence`
- `suggestedOwner`
- `outcome`

## Request Flow

### Dashboard load

1. Browser requests dashboard page.
2. Client requests `GET /api/dashboard`.
3. API returns current signals, exceptions, decision briefs, and metrics.
4. UI renders the command center.

### Live signal refresh

1. User clicks refresh.
2. Browser sends `POST /api/simulate`.
3. The server fetches live GitHub repository signals.
4. If Notion is connected, the server fetches live workspace search signals.
5. The decision engine scores the resulting signals.
6. API returns the updated snapshot.

### Notion connection and publishing

1. User opens the deployed app.
2. User starts Notion OAuth.
3. The server completes discovery, PKCE, and token exchange.
4. Session tokens are stored in secure HTTP-only cookies.
5. The user can search their Notion workspace or publish a decision brief.
6. MCP tool calls execute on the server against the user-owned workspace.

## Production Architecture Evolution

To convert this MVP into a challenge-grade integrated system:

1. Add persistent storage for historical snapshots and decisions.
2. Add more live source connectors for Stripe, support platforms, or calendars.
3. Map published decision pages into a dedicated Notion data source schema.
4. Add a background queue for classification jobs.
5. Add first-party app accounts and a shared team data model.
6. Add audit logs and approval analytics.

## Deployment Plan

- Frontend and API: Vercel
- Repository: GitHub
- Persistent data: Supabase or Postgres
- Notion MCP: service adapter with workspace-scoped credentials

## Risks and Mitigations

- Risk: generic dashboards feel ordinary.
  Mitigation: center the product on exception-driven decisions, not metrics alone.

- Risk: limited source coverage compared to a full enterprise operations stack.
  Mitigation: ship real GitHub and Notion ingestion now, and keep the connector layer ready for additional systems.

- Risk: judging may favor polished demos.
  Mitigation: ship a visually strong command center with an obvious human-in-the-loop workflow.