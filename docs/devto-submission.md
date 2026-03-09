---
title: Exception OS - an AI command center that escalates only what matters
published: false
tags: devchallenge, notionchallenge, mcp, ai
---

*This is a submission for the [Notion MCP Challenge](https://dev.to/challenges/notion-2026-03-04)*

**Live demo:** https://exception-os.vercel.app

**GitHub repository:** https://github.com/aniruddhaadak80/exception-os

## What I Built

I built **Exception OS**, an exception-first operating system for teams drowning in operational noise.

Most AI productivity tools summarize everything. Exception OS takes the opposite approach: it watches incoming signals, detects the smaller set of incidents that actually require human judgment, and turns them into structured decision briefs.

The application includes:

- A live operations dashboard for signals, exceptions, and decision briefs
- A real Notion MCP integration using OAuth, PKCE, token refresh, and server-side MCP tool calls
- Publishing of decision briefs directly into Notion pages or databases
- Workspace sync that pulls context back from Notion search
- A polished challenge demo with incident simulation for GitHub, support, revenue, calendar, and documentation failures

In short, Exception OS treats Notion as the operational memory and approval layer for critical decisions.

## Screenshots

### Desktop dashboard

![Exception OS desktop dashboard](https://raw.githubusercontent.com/aniruddhaadak80/exception-os/main/docs/assets/exception-os-dashboard-desktop.png)

### Mobile dashboard

![Exception OS mobile dashboard](https://raw.githubusercontent.com/aniruddhaadak80/exception-os/main/docs/assets/exception-os-dashboard-mobile.png)

## Video Demo

I am using production screenshots in this submission and the live deployed app for verification.

Live demo: https://exception-os.vercel.app

## How I Used Notion MCP

Notion MCP is not decorative in this project. It is a core runtime integration.

I used a real server-side Notion MCP client to:

- Authenticate users with OAuth 2.0 and PKCE
- Discover Notion MCP OAuth metadata dynamically
- Connect to `https://mcp.notion.com/mcp` over Streamable HTTP
- Call Notion MCP tools to inspect the authenticated workspace
- Publish decision briefs into Notion as durable operating records
- Search the workspace for contextual material that can inform the next decision

That means the app does not just mention Notion. It actually reads from and writes to Notion through MCP.

## Why I Built It

Teams do not usually fail because they lacked dashboards. They fail because critical exceptions get buried across tools, owners, and conversations.

Exception OS is designed around a simple idea:

> AI should interrupt humans only when judgment is required.

When a real exception appears, Exception OS creates a decision brief with:

- what happened
- why it matters now
- likely cause
- recommended next actions
- suggested owner
- evidence trace

From there, the brief can be pushed into Notion, where the team can review, approve, and preserve the decision as organizational memory.

## App Architecture

The app is built with:

- Next.js App Router
- React 19
- Server-side Notion MCP client using `@modelcontextprotocol/sdk`
- Secure encrypted cookies for session state
- Local simulation engine for challenge-friendly live incidents

The architecture intentionally separates:

- signal generation
- decision synthesis
- Notion publishing
- workspace context sync

That keeps the demo impressive today while making the path to production obvious.

## Challenges I Ran Into

The hardest part was treating Notion MCP like a real application integration rather than a prompt-only connector.

That required:

- handling RFC 9470 protected resource discovery
- handling RFC 8414 authorization server discovery
- implementing PKCE correctly
- storing session and token state server-side only
- preparing for token refresh and reconnect scenarios
- designing a UI that still works in demo mode when a workspace is not yet connected

That extra work was worth it because it turned the project from a mock into a real integration.

## What’s Next

The current version focuses on the decision layer and Notion MCP integration. The next steps are:

- replace simulated signals with live GitHub, support, and revenue connectors
- store exceptions in a dedicated Notion data source schema
- add approval analytics and learning from human edits
- add multi-user workspace support for teams

## Repo

GitHub repository: https://github.com/aniruddhaadak80/exception-os

## Try It

Clone the repo, add the environment variables, run the app, connect your Notion workspace, and start publishing operational decisions directly into Notion.