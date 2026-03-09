# Exception OS

Exception OS is a demo-ready operating system for teams that need fewer dashboards and faster decisions. It ingests operational signals, detects exceptions that require human judgment, generates structured decision briefs, and routes them into a Notion-centered workflow.

[Live Demo](https://exception-os.vercel.app) · [GitHub Repository](https://github.com/aniruddhaadak80/exception-os) · [DEV Submission Draft](./docs/devto-submission.md)

## Status

Exception OS is complete as a deployable challenge app.

- Production deployment is live on Vercel.
- The dashboard is responsive and verified on desktop and mobile layouts.
- Lint, tests, and production build are passing.
- Real Notion MCP OAuth, workspace sync, and Notion publishing are implemented server-side.

The only runtime step that still depends on the user is approving Notion OAuth for a specific workspace, which cannot be done automatically on someone else’s behalf.

## Screenshots

### Desktop

![Exception OS desktop dashboard](./docs/assets/exception-os-dashboard-desktop.png)

### Mobile

![Exception OS mobile dashboard](./docs/assets/exception-os-dashboard-mobile.png)

This repository contains:

- A polished Next.js demo app for the Exception OS dashboard
- A local simulation engine for signals, exceptions, and decisions
- A real server-side Notion MCP integration for OAuth, workspace search, and publishing
- Product documentation for the feature spec and architecture
- A challenge-ready narrative aligned with the Notion MCP judging criteria

## Why this project fits the challenge

Most AI productivity tools summarize noise. Exception OS focuses on the smaller set of events that actually need executive attention. Notion MCP is the intended system of record for signals, playbooks, decisions, and approvals.

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

This version runs as a polished challenge demo out of the box, and upgrades into a real Notion-connected workflow when the Notion MCP configuration is present. External signal feeds are still simulated, but Notion read and write operations are live once connected.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```