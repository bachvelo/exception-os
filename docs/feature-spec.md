# Exception OS Feature Spec

## Product Summary

Exception OS is an AI-powered operational command center that watches incoming signals across a business, detects moments that require human judgment, and converts them into structured decision briefs. Its core promise is simple: do not summarize everything, escalate only what matters.

For the challenge build, the product is delivered as a deployed SaaS-style web application with real per-user Notion workspace connectivity and live upstream signals from GitHub plus connected Notion workspace context.

## Challenge Positioning

This concept is designed to score well on:

- Originality and creativity: it shifts AI from passive summarization to exception-driven operating control.
- Technical complexity: it combines ingestion, classification, prioritization, decision synthesis, approvals, and audit trails.
- Practical implementation: teams can use it immediately for product, support, operations, and leadership workflows.

## Target Users

- Startup founders and chiefs of staff
- Product and engineering leaders
- Revenue and support operations teams
- Solo operators managing many concurrent systems

## Primary User Problem

Teams miss important issues because their context is fragmented across tools. Existing dashboards create awareness but not action. Existing chat assistants answer questions, but they do not continuously detect exceptions, draft decisions, or maintain operational memory.

## Product Goals

- Reduce time-to-awareness for operational risk
- Reduce time-to-decision for cross-functional issues
- Keep a durable memory of exceptions, actions, and outcomes
- Preserve human approval for meaningful decisions
- Make Notion the control plane for governance and team memory

## Core User Story

As an operator, I want a system that continuously scans operational signals, identifies exceptions worth my attention, drafts a decision brief with evidence and recommended actions, and records the result into Notion so my team can act without losing context.

## Functional Scope

### 1. Signal Intake

The system receives structured or semi-structured events from operational sources.

Examples:

- GitHub deployment failures
- Support escalations from high-value customers
- Revenue anomalies or failed payments
- Calendar collisions for launch-critical meetings
- Documentation gaps blocking launches

### 2. Exception Detection

The system evaluates each signal against a combination of deterministic rules and AI classification.

Evaluation dimensions:

- Severity
- Business impact
- Urgency
- Confidence
- Owner clarity
- Playbook match

### 3. Decision Brief Generation

For every exception, the system drafts a brief containing:

- What happened
- Why it matters now
- Most likely cause
- Recommended actions
- Suggested owner
- Evidence trace
- Confidence score
- SLA risk

### 4. Human Approval Layer

Operators can:

- Approve the recommendation
- Reject the recommendation
- Revise the recommendation before approval

### 5. Operational Memory

All exceptions and decisions are stored in a durable knowledge layer represented by Notion databases and pages.

### 6. Feedback Loop

Human edits to recommendations become learning signals that improve future routing, templates, and exception thresholds.

## Demo MVP Features

- Operations dashboard with active exception queue
- Signal feed with severity and source metadata
- Decision brief viewer
- Recommended next actions
- Live GitHub ingestion for repository activity
- Live Notion workspace search used as an operational signal source
- Metrics cards for exception volume, average confidence, and average SLA pressure
- Per-user Notion OAuth connection
- Live Notion workspace sync through MCP
- Live publishing of decision briefs to Notion

## Out-of-Scope for MVP

- First-party app accounts beyond per-user Notion OAuth sessions
- Shared team collaboration model outside the connected Notion workspace
- Additional live integrations beyond GitHub and Notion-based signal ingestion
- True LLM inference pipeline
- Background workers and persistent database

## Notion MCP Role

In the current shipped version, Notion MCP is a core runtime dependency, not a cosmetic integration.

Notion stores and governs:

- Signal registry
- Exception queue
- Decision briefs
- Response playbooks
- Owner map
- Outcome history

## Key Differentiators

- Exception-first rather than summary-first
- Structured human-in-the-loop governance
- Decision memory as a product feature
- Easy to demonstrate with realistic business scenarios

## MVP Success Metrics

- Time from signal to exception draft under 30 seconds in demo mode
- Decision brief quality rated as useful by a human reviewer
- Dashboard can simulate multiple exception types without code changes
- Live Notion publishing works for any connected user workspace
- Live GitHub ingestion works without seeded demo incidents
- Architecture clearly shows production path to broader source connectors

## Winning Demo Narrative

"Exception OS monitors an entire business, but interrupts humans only when judgment is required. When a critical operational issue appears, it creates a decision brief, recommends the next move, and records the outcome in a Notion-based operating system."