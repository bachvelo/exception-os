import { DashboardSnapshot, DecisionBrief, ExceptionRecord, ImpactArea, Priority, Severity, Signal, SignalSource } from "@/lib/types";
import { fetchGitHubSignals } from "@/lib/live-sources";
import { fetchNotionSignals } from "@/lib/notion/adapter";

const ownersByImpact: Record<ImpactArea, string> = {
  Engineering: "Platform Lead",
  Customer: "Support Director",
  Revenue: "Revenue Ops",
  Operations: "Chief of Staff",
};

const reasonBySource: Record<SignalSource, string> = {
  GitHub: "Engineering activity requires review before it turns into a delivery risk.",
  Support: "A live customer-facing signal indicates a support escalation that needs ownership.",
  Revenue: "A live revenue-related signal indicates commercial risk or unexplained movement.",
  Calendar: "A live schedule signal indicates coordination or deadline risk.",
  Docs: "A live documentation or launch-readiness signal indicates an operational gap.",
};

const causeBySource: Record<SignalSource, string> = {
  GitHub: "The repository activity suggests an engineering workflow problem, unresolved issue, or failing release path.",
  Support: "Customer context in the connected workspace suggests unresolved ownership or blocked resolution flow.",
  Revenue: "Revenue-related context suggests churn, payment, renewal, or ownership friction that needs intervention.",
  Calendar: "Calendar or milestone context suggests the schedule is misaligned with the required approvals or deliverables.",
  Docs: "Documentation context suggests the operational record is lagging behind product or launch activity.",
};

const actionBySource: Record<SignalSource, string[]> = {
  GitHub: [
    "Review the underlying repository activity and identify the blocking change or workflow failure.",
    "Assign an engineering owner and capture the next checkpoint in Notion.",
    "Publish a decision brief so the team has a single source of operational truth."
  ],
  Support: [
    "Assign a single incident owner for the customer-facing issue.",
    "Capture the current blocker and next update time in Notion.",
    "Coordinate product and support response before the issue escalates further."
  ],
  Revenue: [
    "Review the affected accounts or pipeline segment immediately.",
    "Document the working theory and owner in Notion.",
    "Prepare a mitigation or outreach plan before the next reporting window."
  ],
  Calendar: [
    "Confirm owner availability and milestone dependencies.",
    "Resolve date conflicts or missing approvals.",
    "Capture the revised plan in Notion so all stakeholders have one operating record."
  ],
  Docs: [
    "Review the missing or recently changed documentation artifact.",
    "Assign an owner for the operational record and rollout note.",
    "Publish the decision brief to Notion so documentation and execution stay aligned."
  ],
};

const scoreBySeverity: Record<Severity, number> = {
  Low: 20,
  Medium: 45,
  High: 72,
  Critical: 92,
};

const priorityFromSeverity = (severity: Severity): Priority => {
  if (severity === "Critical") {
    return "Urgent";
  }

  if (severity === "High") {
    return "Elevated";
  }

  return "Watch";
};

const toException = (signal: Signal): ExceptionRecord => ({
  id: `exc-${signal.id}`,
  signalId: signal.id,
  priority: priorityFromSeverity(signal.severity),
  status: signal.severity === "Critical" ? "Investigating" : "Ready for Approval",
  confidence: scoreBySeverity[signal.severity],
  reason: reasonBySource[signal.source],
  owner: ownersByImpact[signal.impactArea],
  slaMinutes: signal.severity === "Critical" ? 15 : signal.severity === "High" ? 30 : 90,
});

const toDecision = (signal: Signal, exceptionRecord: ExceptionRecord): DecisionBrief => ({
  id: `dec-${signal.id}`,
  exceptionId: exceptionRecord.id,
  headline: `${signal.impactArea} exception: ${signal.title}`,
  whyNow: reasonBySource[signal.source],
  likelyCause: causeBySource[signal.source],
  recommendedActions: actionBySource[signal.source],
  evidence: [
    signal.summary,
    `Affected entity: ${signal.affectedEntity}`,
    `Observed at: ${new Date(signal.receivedAt).toLocaleString()}`,
  ],
  suggestedOwner: exceptionRecord.owner,
  outcome: exceptionRecord.status === "Investigating" ? "Needs Revision" : "Drafted",
});

const computeMetrics = (exceptions: ExceptionRecord[]) => ({
  exceptionCount: exceptions.length,
  urgentCount: exceptions.filter((item) => item.priority === "Urgent").length,
  averageConfidence: exceptions.length ? Math.round(exceptions.reduce((sum, item) => sum + item.confidence, 0) / exceptions.length) : 0,
  averageSlaMinutes: exceptions.length ? Math.round(exceptions.reduce((sum, item) => sum + item.slaMinutes, 0) / exceptions.length) : 0,
});

const buildSourceSummary = (signals: Signal[]) => {
  const sources = Array.from(new Set(signals.map((signal) => signal.source)));

  if (sources.length === 0) {
    return "No live signal sources responded.";
  }

  return `Live signals from ${sources.join(", ")}.`;
};

export const getDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  const [githubSignals, notionSignals] = await Promise.all([fetchGitHubSignals(), fetchNotionSignals()]);
  const signals = [...githubSignals, ...notionSignals]
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
    .slice(0, 8);
  const exceptions = signals.map((signal) => toException(signal));
  const decisions = signals.map((signal, index) => toDecision(signal, exceptions[index]));

  return {
    generatedAt: new Date().toISOString(),
    metrics: computeMetrics(exceptions),
    signals,
    exceptions,
    decisions,
    sourceSummary: buildSourceSummary(signals),
  };
};

export const simulateSignal = async (): Promise<DashboardSnapshot> => getDashboardSnapshot();

export const getDecisionPayload = async (exceptionId: string) => {
  const snapshot = await getDashboardSnapshot();
  const exceptionRecord = snapshot.exceptions.find((item) => item.id === exceptionId);

  if (!exceptionRecord) {
    return null;
  }

  const signal = snapshot.signals.find((item) => item.id === exceptionRecord.signalId);
  const decision = snapshot.decisions.find((item) => item.exceptionId === exceptionRecord.id);

  if (!signal || !decision) {
    return null;
  }

  return {
    exceptionRecord,
    signal,
    decision,
  };
};