---
title: Exception OS - a deployed AI operating system with real Notion MCP workflows
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
- A real Notion MCP integration using OAuth, PKCE, token refresh, and server-side MCP tool calls
- Publishing of decision briefs directly into Notion pages or databases
- Workspace sync that pulls context back from Notion search
- A polished challenge build with deterministic incident ingestion for GitHub, support, revenue, calendar, and documentation failures

In short, Exception OS treats Notion as the operational memory and approval layer for critical decisions.

## What Is Real vs Demo Mode

The important distinction in this project is that the **Notion workflow is fully real**, while the **upstream signal ingestion is currently demo-mode**.

### Real today

- public deployment on Vercel
- per-user Notion workspace connection via OAuth
- secure server-side MCP client with token refresh
- live Notion search
- live publishing of decision briefs into Notion

### Demo mode today

- source signals are seeded and simulated rather than pulled from live SaaS connectors

I chose that boundary intentionally so the judging flow stays reliable while the central Notion MCP workflow remains real and testable.

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
- Deterministic signal engine for challenge-friendly incident ingestion

The architecture intentionally separates:

- signal generation
- decision synthesis
- Notion publishing
- workspace context sync

That keeps the live Notion workflow real today while making the path to fully live source ingestion obvious.

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

The second challenge was deciding where to keep the build honest. I did not want to pretend that simulated source feeds were the same as live source connectors. So I kept the demo signal layer explicit and focused the real implementation effort on the Notion MCP workflow, which is the core of the challenge.

## What’s Next

The current version focuses on the decision layer and Notion MCP integration. The next steps are:

- replace simulated signals with live GitHub, support, and revenue connectors
- store exceptions in a dedicated Notion data source schema
- add approval analytics and learning from human edits
- add first-party app accounts and shared team workspaces

## Repo

GitHub repository: https://github.com/aniruddhaadak80/exception-os

## Try It

Open the live app, connect your Notion workspace, and start publishing operational decisions directly into Notion. If you want to run it locally, clone the repo, add the environment variables, and start the Next.js app.