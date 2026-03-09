import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type NotionSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  clientId: string;
  clientSecret?: string;
  publishTarget?: {
    type: "page_id" | "database_id" | "data_source_id";
    id: string;
    label?: string;
  };
};

export type NotionAuthFlowState = {
  state: string;
  codeVerifier: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
};

export const NOTION_SESSION_COOKIE = "exception-os-notion-session";
export const NOTION_FLOW_COOKIE = "exception-os-notion-flow";

const SESSION_SECRET_ENV = "EXCEPTION_OS_SESSION_SECRET";

const base64UrlEncode = (value: Buffer) =>
  value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return Buffer.from(normalized + padding, "base64");
};

const getSecretKey = () => {
  const secret = process.env[SESSION_SECRET_ENV];

  if (!secret) {
    throw new Error(`${SESSION_SECRET_ENV} is required to enable the Notion MCP OAuth session.`);
  }

  return createHash("sha256").update(secret).digest();
};

export const seal = (payload: unknown) => {
  const iv = randomBytes(12);
  const key = getSecretKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [base64UrlEncode(iv), base64UrlEncode(tag), base64UrlEncode(encrypted)].join(".");
};

export const unseal = <T>(value?: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    const [ivPart, tagPart, payloadPart] = value.split(".");

    if (!ivPart || !tagPart || !payloadPart) {
      return null;
    }

    const key = getSecretKey();
    const decipher = createDecipheriv("aes-256-gcm", key, base64UrlDecode(ivPart));
    decipher.setAuthTag(base64UrlDecode(tagPart));
    const decrypted = Buffer.concat([decipher.update(base64UrlDecode(payloadPart)), decipher.final()]);

    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch {
    return null;
  }
};

export const hasSessionSecret = () => Boolean(process.env[SESSION_SECRET_ENV]);