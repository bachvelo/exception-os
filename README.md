# Exception OS

Exception OS is a deployed SaaS-style operating system for teams that need fewer dashboards and faster decisions. It ingests operational signals, detects exceptions that require human judgment, generates structured decision briefs, and routes them into a Notion-centered workflow.

[Live Demo](https://exception-os.vercel.app) · [GitHub Repository](https://github.com/aniruddhaadak80/exception-os) · [DEV Submission Draft](./docs/devto-submission.md)

## Status

Exception OS is complete as a deployable challenge app and SaaS-style product foundation.

- Production deployment is live on Vercel.
- The dashboard is responsive and verified on desktop and mobile layouts.
- Lint, tests, and production build are passing.
- Real Notion MCP OAuth, workspace sync, and Notion publishing are implemented server-side.
- Other users can use the deployed app by connecting their own Notion workspace.

The only runtime step that still depends on the user is approving Notion OAuth for a specific workspace, which cannot be done automatically on someone else’s behalf.

## What Is Real Today

- Multi-user deployment through the public Vercel app
- Per-user Notion OAuth connection flow
- Live Notion MCP workspace search
- Live publishing of decision briefs into the connected workspace
- Production build, linting, tests, screenshots, and challenge documentation

## What Is In Demo Mode

- Upstream operational signal ingestion currently uses deterministic challenge data instead of live SaaS connectors
- Exception generation is based on a seeded in-app signal engine rather than persisted external event streams

This means the app is not a fake mockup. It is a real deployed product with a real Notion integration, while the upstream source feeds are intentionally demo-mode for reliability during judging.

## Screenshots

### Desktop

![Exception OS desktop dashboard](./docs/assets/exception-os-dashboard-desktop.png)

### Mobile

![Exception OS mobile dashboard](./docs/assets/exception-os-dashboard-mobile.png)

This repository contains:

- A polished Next.js production deployment for the Exception OS dashboard
- A local simulation engine for signals, exceptions, and decisions
- A real server-side Notion MCP integration for OAuth, workspace search, and publishing
- Product documentation for the feature spec and architecture
- A challenge-ready narrative aligned with the Notion MCP judging criteria

## Why this project fits the challenge

Most AI productivity tools summarize noise. Exception OS focuses on the smaller set of events that actually need executive attention. Notion MCP is the live system of record for workspace memory, decision publishing, and operator context.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Notion MCP integration

This app now includes a real server-side Notion MCP adapter with OAuth, token refresh support, workspace search, and page publishing.

To enable it locally or on Vercel, configure:

- `EXCEPTION_OS_SESSION_SECRET`: long random string used to encrypt server-side session cookies

Optional:

- `NOTION_MCP_SERVER_URL`: defaults to `https://mcp.notion.com`
- `NOTION_PARENT_PAGE_ID` or `NOTION_PARENT_DATABASE_ID`: custom Notion location for published decision briefs. If omitted, Exception OS publishes to the workspace root when supported by the connected workspace.

Once configured, use the dashboard's `Connect Notion MCP` action to complete OAuth.

## Demo flow

1. View the live operations board.
2. Review the active exception queue.
3. Trigger a new simulated incident from the dashboard.
4. Connect Notion MCP and publish the selected decision brief into your workspace.
5. Sync related workspace context back into the dashboard.

## Challenge submission

The prepared DEV submission is in [./docs/devto-submission.md](./docs/devto-submission.md). It already includes the real screenshots, live demo URL, and GitHub repo link.

## Project structure

- `src/app` app routes and API endpoints
- `src/components` UI components
- `src/lib` simulation engine and shared types
- `docs` feature spec and architecture documents

## Current implementation scope

This version runs as a polished challenge app out of the box and already includes a real Notion-connected workflow. External signal feeds are still demo-mode, but Notion read and write operations are live once connected, and the deployed app is usable by other users with their own Notion workspace.

## Judge-Facing Summary

If you are using this README to understand challenge readiness, the most accurate summary is:

- The app is fully deployed and usable.
- The Notion MCP integration is real and central to the product.
- The upstream signal layer is intentionally demo-mode to keep the judging flow reliable.
- The architecture is already structured for live source connectors as the next production increment.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```