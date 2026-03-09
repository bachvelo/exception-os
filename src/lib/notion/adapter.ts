import { cookies } from "next/headers";
import { DecisionBrief, ExceptionRecord, NotionActionResult, NotionStatus, Signal } from "@/lib/types";
import { createNotionSearchSignal } from "@/lib/live-sources";
import {
  buildAuthorizationUrl,
  discoverOAuthMetadata,
  exchangeCodeForTokens,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  refreshAccessToken,
  registerClient,
} from "@/lib/notion/oauth";
import { callTool, createNotionClient, listToolNames, pickToolName } from "@/lib/notion/mcp-client";
import { getConfiguredPublishTarget, parseNotionPublishTarget, toNotionParent } from "@/lib/notion/publish-target";
import {
  hasSessionSecret,
  NOTION_FLOW_COOKIE,
  NOTION_SESSION_COOKIE,
  NotionAuthFlowState,
  NotionSession,
  seal,
  unseal,
} from "@/lib/notion/session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const FLOW_MAX_AGE = 60 * 10;

const getServerUrl = () => process.env.NOTION_MCP_SERVER_URL ?? "https://mcp.notion.com";

const getCookieStore = async () => cookies();

const saveCookie = async (name: string, value: string, maxAge: number) => {
  const cookieStore = await getCookieStore();
  cookieStore.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
};

const clearCookie = async (name: string) => {
  const cookieStore = await getCookieStore();
  cookieStore.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};

const readSession = async () => {
  const cookieStore = await getCookieStore();
  return unseal<NotionSession>(cookieStore.get(NOTION_SESSION_COOKIE)?.value);
};

const writeSession = async (session: NotionSession) => {
  await saveCookie(NOTION_SESSION_COOKIE, seal(session), SESSION_MAX_AGE);
};

const resolvePublishTarget = (session?: NotionSession | null) => getConfiguredPublishTarget() ?? session?.publishTarget ?? null;

const readFlowState = async () => {
  const cookieStore = await getCookieStore();
  return unseal<NotionAuthFlowState>(cookieStore.get(NOTION_FLOW_COOKIE)?.value);
};

const writeFlowState = async (state: NotionAuthFlowState) => {
  await saveCookie(NOTION_FLOW_COOKIE, seal(state), FLOW_MAX_AGE);
};

const clearFlowState = async () => {
  await clearCookie(NOTION_FLOW_COOKIE);
};

export async function beginNotionAuth(origin: string) {
  if (!hasSessionSecret()) {
    throw new Error("EXCEPTION_OS_SESSION_SECRET is missing. Add it before connecting Notion MCP.");
  }

  const serverUrl = getServerUrl();
  const redirectUri = `${origin}/api/notion/callback`;
  const metadata = await discoverOAuthMetadata(serverUrl);
  const credentials = await registerClient(metadata, redirectUri);
  const codeVerifier = generateCodeVerifier();
  const state = generateState();

  await writeFlowState({
    state,
    codeVerifier,
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    redirectUri,
  });

  return buildAuthorizationUrl({
    metadata,
    clientId: credentials.client_id,
    redirectUri,
    codeChallenge: generateCodeChallenge(codeVerifier),
    state,
  });
}

export async function completeNotionAuth(origin: string, code: string, state: string) {
  const flowState = await readFlowState();

  if (!flowState) {
    throw new Error("The Notion OAuth flow has expired. Start the connection again.");
  }

  if (flowState.state !== state) {
    throw new Error("The Notion OAuth state check failed.");
  }

  const metadata = await discoverOAuthMetadata(getServerUrl());
  const tokens = await exchangeCodeForTokens({
    code,
    codeVerifier: flowState.codeVerifier,
    metadata,
    clientId: flowState.clientId,
    clientSecret: flowState.clientSecret,
    redirectUri: flowState.redirectUri || `${origin}/api/notion/callback`,
  });

  await writeSession({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
    clientId: flowState.clientId,
    clientSecret: flowState.clientSecret,
  });

  await clearFlowState();
}

export async function disconnectNotion() {
  await clearCookie(NOTION_SESSION_COOKIE);
  await clearFlowState();
}

async function getAuthenticatedClient() {
  const session = await readSession();

  if (!session) {
    throw new Error("Not connected to Notion MCP.");
  }

  let activeSession = session;

  if (session.expiresAt && session.expiresAt - Date.now() < 10 * 60 * 1000 && session.refreshToken) {
    const metadata = await discoverOAuthMetadata(getServerUrl());
    const refreshed = await refreshAccessToken({
      refreshToken: session.refreshToken,
      metadata,
      clientId: session.clientId,
      clientSecret: session.clientSecret,
    });

    activeSession = {
      ...session,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? session.refreshToken,
      expiresAt: refreshed.expires_in ? Date.now() + refreshed.expires_in * 1000 : session.expiresAt,
    };

    await writeSession(activeSession);
  }

  const client = await createNotionClient(getServerUrl(), activeSession.accessToken);
  const tools = await listToolNames(client);

  return { client, tools };
}

const extractFirstUrl = (text: string) => text.match(/https?:\/\/\S+/)?.[0];

export async function getNotionStatus(): Promise<NotionStatus> {
  const configuredTarget = getConfiguredPublishTarget();

  if (!hasSessionSecret()) {
    return {
      connected: false,
      ready: false,
      canPublish: false,
      serverUrl: getServerUrl(),
      availableTools: [],
      configurationMessage: "Add EXCEPTION_OS_SESSION_SECRET to enable the Notion MCP OAuth session.",
    };
  }

  const session = await readSession();

  if (!session) {
    return {
      connected: false,
      ready: false,
      canPublish: false,
      serverUrl: getServerUrl(),
      availableTools: [],
      configurationMessage: "Connect Notion MCP to enable live workspace search and publishing.",
    };
  }

  const publishTarget = resolvePublishTarget(session) ?? configuredTarget;

  try {
    const { client, tools } = await getAuthenticatedClient();
    const selfTool = pickToolName(tools, ["notion-get-self", "get-self"]);
    let accountLabel: string | undefined;

    if (selfTool) {
      const self = await callTool(client, selfTool, {});
      accountLabel = self.text.split("\n")[0];
    }

    return {
      connected: true,
      ready: true,
      canPublish: Boolean(publishTarget),
      serverUrl: getServerUrl(),
      availableTools: tools,
      accountLabel,
      configurationMessage: publishTarget ? undefined : "Add a Notion page URL or page ID before publishing a decision brief.",
      publishTargetLabel: publishTarget?.label,
      publishTargetType: publishTarget?.type,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "REAUTH_REQUIRED") {
      await disconnectNotion();

      return {
        connected: false,
        ready: false,
        canPublish: false,
        serverUrl: getServerUrl(),
        availableTools: [],
        error: "Your Notion session expired and needs to be reconnected.",
      };
    }

    return {
      connected: true,
      ready: false,
      canPublish: Boolean(publishTarget),
      serverUrl: getServerUrl(),
      availableTools: [],
      publishTargetLabel: publishTarget?.label,
      publishTargetType: publishTarget?.type,
      error: error instanceof Error ? error.message : "Unable to connect to Notion MCP.",
    };
  }
}

export async function savePublishTarget(input: string) {
  const session = await readSession();

  if (!session) {
    throw new Error("Connect Notion MCP before setting a publish target.");
  }

  const publishTarget = parseNotionPublishTarget(input);

  await writeSession({
    ...session,
    publishTarget,
  });

  return publishTarget;
}

export async function syncWorkspaceContext(query: string) {
  const { client, tools } = await getAuthenticatedClient();
  const searchTool = pickToolName(tools, ["notion-search", "search"]);

  if (!searchTool) {
    throw new Error("The connected Notion MCP workspace does not expose a search tool.");
  }

  const result = await callTool(client, searchTool, { query });

  return result.text;
}

export async function fetchNotionSignals(): Promise<Signal[]> {
  const session = await readSession();

  if (!session) {
    return [];
  }

  try {
    const { client, tools } = await getAuthenticatedClient();
    const searchTool = pickToolName(tools, ["notion-search", "search"]);

    if (!searchTool) {
      return [];
    }

    const queries = [
      { source: "Support" as const, impactArea: "Customer" as const, query: process.env.NOTION_SUPPORT_QUERY ?? "support escalation customer blocker" },
      { source: "Revenue" as const, impactArea: "Revenue" as const, query: process.env.NOTION_REVENUE_QUERY ?? "revenue renewal churn payment blocker" },
      { source: "Calendar" as const, impactArea: "Operations" as const, query: process.env.NOTION_CALENDAR_QUERY ?? "launch deadline review schedule blocker" },
      { source: "Docs" as const, impactArea: "Engineering" as const, query: process.env.NOTION_DOCS_QUERY ?? "runbook launch brief documentation gap" },
    ];

    const results = await Promise.all(
      queries.map(async (definition) => {
        const output = await callTool(client, searchTool, { query: definition.query });

        return createNotionSearchSignal({
          source: definition.source,
          impactArea: definition.impactArea,
          query: definition.query,
          text: output.text,
        });
      })
    );

    return results.filter((item): item is Signal => Boolean(item));
  } catch {
    return [];
  }
}

const buildDecisionMarkdown = (signal: Signal, exceptionRecord: ExceptionRecord, decision: DecisionBrief) => `# ${decision.headline}

## Signal

- Source: ${signal.source}
- Severity: ${signal.severity}
- Impact area: ${signal.impactArea}
- Affected entity: ${signal.affectedEntity}
- Received: ${signal.receivedAt}

## Why now

${decision.whyNow}

## Likely cause

${decision.likelyCause}

## Recommended actions

${decision.recommendedActions.map((item) => `- ${item}`).join("\n")}

## Evidence trace

${decision.evidence.map((item) => `- ${item}`).join("\n")}

## Operational metadata

- Priority: ${exceptionRecord.priority}
- Status: ${exceptionRecord.status}
- Suggested owner: ${decision.suggestedOwner}
- Confidence: ${exceptionRecord.confidence}%
- SLA minutes: ${exceptionRecord.slaMinutes}
`;

export async function publishDecisionToNotion(payload: {
  signal: Signal;
  exceptionRecord: ExceptionRecord;
  decision: DecisionBrief;
}): Promise<NotionActionResult> {
  const session = await readSession();
  const publishTarget = resolvePublishTarget(session);

  if (!publishTarget) {
    throw new Error("Add a Notion page URL or page ID before publishing to Notion.");
  }

  const parent = toNotionParent(publishTarget);

  const { client, tools } = await getAuthenticatedClient();
  const createPagesTool = pickToolName(tools, ["notion-create-pages"]);
  const createPageTool = pickToolName(tools, ["notion-create-a-page", "create-a-page"]);
  const title = `Exception OS - ${payload.signal.title}`;
  const content = buildDecisionMarkdown(payload.signal, payload.exceptionRecord, payload.decision);

  let outputText = "";

  if (createPagesTool) {
    const result = await callTool(client, createPagesTool, {
      parent,
      pages: [
        {
          properties: {
            title,
          },
          content,
        },
      ],
    });

    outputText = result.text;
  } else if (createPageTool) {
    const result = await callTool(client, createPageTool, {
      parent,
      properties: {
        title,
      },
      children: [],
      content,
    });

    outputText = result.text;
  } else {
    throw new Error("The connected Notion MCP workspace does not expose a page creation tool.");
  }

  const pageUrl = extractFirstUrl(outputText);

  return {
    ok: true,
    summary: pageUrl ? `Decision brief published to Notion: ${pageUrl}` : outputText,
    pageUrl,
  };
}