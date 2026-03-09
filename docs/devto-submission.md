---
title: Exception OS - a deployed AI operating system with live Notion MCP and GitHub workflows
published: false
tags: devchallenge, notionchallenge, mcp, ai
---

*This is a submission for the [Notion MCP Challenge](https://dev.to/challenges/notion-2026-03-04)*

**Live demo:** https://exception-os.vercel.app

**GitHub repository:** https://github.com/aniruddhaadak80/exception-os

## What I Built

I built **Exception OS**, an exception-first operating system for teams drowning in operational noise.

Most AI productivity tools summarize everything. Exception OS takes the opposite approach: it watches incoming signals, detects the smaller set of incidents that actually require human judgment, and turns them into structured decision briefs.

This challenge build is already deployed as a public web app. Other users can open it, connect their own Notion workspace, and use the live Notion workflow immediately.

The application includes:

- A live operations dashboard for signals, exceptions, and decision briefs
- Live GitHub ingestion for repository activity, workflow state, milestones, and documentation changes
- A real Notion MCP integration using OAuth, PKCE, token refresh, and server-side MCP tool calls
- Publishing of decision briefs directly into Notion pages or databases
- Workspace sync that pulls context back from Notion search
- A polished challenge build that combines GitHub activity with connected Notion workspace context

In short, Exception OS treats Notion as the operational memory and approval layer for critical decisions.

## What Is Real Today

Everything in the core workflow is now live:

- public deployment on Vercel
- per-user Notion workspace connection via OAuth
- secure server-side MCP client with token refresh
- live Notion search
- live publishing of decision briefs into Notion
- live GitHub repository ingestion for upstream operational signals

The current limitation is not simulation. The limitation is **connector breadth**: GitHub and Notion are live today, while other systems like Stripe or dedicated support tools are still future connectors.

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

It also means different users can connect different Notion workspaces, which makes the deployed app usable beyond my own environment.

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
- Live GitHub signal engine plus connected Notion workspace ingestion

The architecture intentionally separates:

- signal generation
- decision synthesis
- Notion publishing
- workspace context sync

That gives the product a real end-to-end loop today while keeping the path to broader connector coverage obvious.

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

The second challenge was turning the upstream feed into something real without depending on private customer infrastructure. I solved that by using live GitHub activity as a public operational signal source and live Notion workspace context as the operator memory layer.

## What’s Next

The current version focuses on the decision layer and Notion MCP integration. The next steps are:

- add more live connectors for support, revenue, and calendar systems beyond GitHub and Notion
- store exceptions in a dedicated Notion data source schema
- add approval analytics and learning from human edits
- add first-party app accounts and shared team workspaces

## Repo

GitHub repository: https://github.com/aniruddhaadak80/exception-os

## Try It

Open the live app, connect your Notion workspace, and start publishing operational decisions directly into Notion. If you want to run it locally, clone the repo, add the environment variables, and start the Next.js app.