import { createHash } from "node:crypto";
import { ImpactArea, Severity, Signal, SignalSource } from "@/lib/types";

type GitHubIssue = {
  id: number;
  title: string;
  body: string | null;
  updated_at: string;
  html_url: string;
  labels?: Array<{ name?: string }>;
  pull_request?: unknown;
};

type GitHubWorkflowRun = {
  id: number;
  name: string;
  conclusion: string | null;
  status: string;
  updated_at: string;
  html_url: string;
  head_branch?: string;
  event?: string;
};

type GitHubMilestone = {
  number: number;
  title: string;
  description: string | null;
  due_on: string | null;
  html_url: string;
  open_issues: number;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    author?: { date?: string };
    message: string;
  };
};

type GitHubRunsResponse = {
  workflow_runs?: GitHubWorkflowRun[];
};

const githubRepo = process.env.EXCEPTION_OS_GITHUB_REPO ?? "aniruddhaadak80/exception-os";

const githubHeaders = () => ({
  Accept: "application/vnd.github+json",
  "User-Agent": "Exception-OS/0.1.0",
  ...(process.env.EXCEPTION_OS_GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.EXCEPTION_OS_GITHUB_TOKEN}` } : {}),
});

const firstSentence = (value: string | null | undefined, fallback: string) => {
  const cleaned = (value ?? "").replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return fallback;
  }

  return cleaned.length > 180 ? `${cleaned.slice(0, 177)}...` : cleaned;
};

const buildSignal = (input: {
  id: string;
  source: SignalSource;
  severity: Severity;
  impactArea: ImpactArea;
  title: string;
  summary: string;
  affectedEntity: string;
  receivedAt: string;
}): Signal => input;

const hasLabel = (labels: Array<{ name?: string }> | undefined, matcher: RegExp) =>
  labels?.some((label) => matcher.test(label.name ?? "")) ?? false;

const severityFromText = (text: string, fallback: Severity = "Medium"): Severity => {
  const lowered = text.toLowerCase();

  if (/(critical|sev0|sev1|urgent|outage|failure|failed|blocked)/.test(lowered)) {
    return "Critical";
  }

  if (/(high|sev2|escalat|incident|bug|churn|payment|broken)/.test(lowered)) {
    return "High";
  }

  if (/(minor|notice|docs|planning|meeting|calendar)/.test(lowered)) {
    return "Medium";
  }

  return fallback;
};

const toIssueSignal = (issue: GitHubIssue): Signal => {
  const labels = issue.labels ?? [];
  const labelText = labels.map((label) => label.name ?? "").join(" ");
  const source: SignalSource = hasLabel(labels, /(support|customer)/i)
    ? "Support"
    : hasLabel(labels, /(revenue|billing|finance)/i)
      ? "Revenue"
      : hasLabel(labels, /(docs|documentation|readme|spec)/i)
        ? "Docs"
        : "GitHub";
  const impactArea: ImpactArea = source === "Support" ? "Customer" : source === "Revenue" ? "Revenue" : "Engineering";

  return buildSignal({
    id: `gh-issue-${issue.id}`,
    source,
    severity: severityFromText(`${issue.title} ${labelText} ${issue.body ?? ""}`),
    impactArea,
    title: issue.title,
    summary: `${firstSentence(issue.body, "Live GitHub issue pulled from the configured repository.")} Source: ${issue.html_url}`,
    affectedEntity: githubRepo,
    receivedAt: issue.updated_at,
  });
};

const toWorkflowSignal = (run: GitHubWorkflowRun): Signal =>
  buildSignal({
    id: `gh-run-${run.id}`,
    source: "GitHub",
    severity: run.conclusion === "failure" ? "Critical" : "High",
    impactArea: "Engineering",
    title: `Workflow ${run.conclusion === "failure" ? "failed" : "needs attention"}: ${run.name}`,
    summary: `Live workflow run from ${githubRepo}. Branch: ${run.head_branch ?? "unknown"}. Event: ${run.event ?? "unknown"}. Source: ${run.html_url}`,
    affectedEntity: run.head_branch ?? githubRepo,
    receivedAt: run.updated_at,
  });

const toMilestoneSignal = (milestone: GitHubMilestone): Signal => {
  const dueDate = milestone.due_on ? new Date(milestone.due_on) : null;
  const hoursUntilDue = dueDate ? (dueDate.getTime() - Date.now()) / (1000 * 60 * 60) : null;
  const severity: Severity = hoursUntilDue !== null && hoursUntilDue < 48 ? "High" : "Medium";

  return buildSignal({
    id: `gh-milestone-${milestone.number}`,
    source: "Calendar",
    severity,
    impactArea: "Operations",
    title: `Milestone approaching: ${milestone.title}`,
    summary: `${firstSentence(milestone.description, "Live GitHub milestone schedule pulled from the configured repository.")} Open issues: ${milestone.open_issues}. Source: ${milestone.html_url}`,
    affectedEntity: milestone.title,
    receivedAt: milestone.due_on ?? new Date().toISOString(),
  });
};

const toCommitSignal = (commit: GitHubCommit): Signal => {
  const message = commit.commit.message.split("\n")[0]?.trim() ?? "Repository updated";
  const source: SignalSource = /(docs|documentation|readme|guide|spec)/i.test(message) ? "Docs" : "GitHub";

  return buildSignal({
    id: `gh-commit-${commit.sha.slice(0, 10)}`,
    source,
    severity: source === "Docs" ? "Medium" : "Low",
    impactArea: "Engineering",
    title: source === "Docs" ? `Documentation changed: ${message}` : `Recent repository activity: ${message}`,
    summary: `Live GitHub commit from ${githubRepo}. Source: ${commit.html_url}`,
    affectedEntity: githubRepo,
    receivedAt: commit.commit.author?.date ?? new Date().toISOString(),
  });
};

async function fetchGitHubJson<T>(path: string): Promise<T | null> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: githubHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function fetchGitHubSignals(): Promise<Signal[]> {
  const [issues, runs, milestones, commits] = await Promise.all([
    fetchGitHubJson<GitHubIssue[]>(`/repos/${githubRepo}/issues?state=open&sort=updated&direction=desc&per_page=4`),
    fetchGitHubJson<GitHubRunsResponse>(`/repos/${githubRepo}/actions/runs?per_page=4`),
    fetchGitHubJson<GitHubMilestone[]>(`/repos/${githubRepo}/milestones?state=open&sort=due_on&direction=asc&per_page=2`),
    fetchGitHubJson<GitHubCommit[]>(`/repos/${githubRepo}/commits?per_page=4`),
  ]);

  const liveSignals: Signal[] = [];

  for (const issue of issues?.filter((item) => !item.pull_request).slice(0, 3) ?? []) {
    liveSignals.push(toIssueSignal(issue));
  }

  for (const run of runs?.workflow_runs?.filter((item) => item.conclusion === "failure" || item.status !== "completed").slice(0, 2) ?? []) {
    liveSignals.push(toWorkflowSignal(run));
  }

  for (const milestone of milestones ?? []) {
    liveSignals.push(toMilestoneSignal(milestone));
  }

  const hasDocsSignal = liveSignals.some((signal) => signal.source === "Docs");

  if (!hasDocsSignal) {
    const docsCommit = commits?.find((commit) => /(docs|documentation|readme|guide|spec)/i.test(commit.commit.message)) ?? commits?.[0];

    if (docsCommit) {
      liveSignals.push(toCommitSignal(docsCommit));
    }
  }

  return liveSignals
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
    .slice(0, 6);
}

const cleanSearchText = (value: string) =>
  value
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[#>*`_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleFromSearchText = (source: SignalSource, text: string) => {
  const cleaned = cleanSearchText(text);

  if (!cleaned || /no textual content returned/i.test(cleaned)) {
    return `${source} signal found in workspace`;
  }

  return cleaned.length > 96 ? `${cleaned.slice(0, 93)}...` : cleaned;
};

const hashId = (value: string) => createHash("sha1").update(value).digest("hex").slice(0, 12);

export function createNotionSearchSignal(input: {
  source: SignalSource;
  impactArea: ImpactArea;
  query: string;
  text: string;
}): Signal | null {
  const cleaned = cleanSearchText(input.text);

  if (!cleaned || /no textual content returned|no results/i.test(cleaned)) {
    return null;
  }

  const title = titleFromSearchText(input.source, cleaned);
  const summary = cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;

  return buildSignal({
    id: `notion-${input.source.toLowerCase()}-${hashId(`${input.query}:${cleaned}`)}`,
    source: input.source,
    severity: severityFromText(`${input.query} ${cleaned}`, input.source === "Calendar" ? "Medium" : "High"),
    impactArea: input.impactArea,
    title,
    summary: `Live Notion workspace context for query "${input.query}". ${summary}`,
    affectedEntity: "Connected Notion workspace",
    receivedAt: new Date().toISOString(),
  });
}