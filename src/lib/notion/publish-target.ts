export type NotionPublishTarget = {
  type: "page_id" | "database_id" | "data_source_id";
  id: string;
  label?: string;
};

const formatUuid = (value: string) =>
  `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;

const normalizeId = (value: string) => {
  const hex = value.replace(/-/g, "").toLowerCase();

  if (!/^[0-9a-f]{32}$/.test(hex)) {
    return null;
  }

  return formatUuid(hex);
};

const extractIdFromUrl = (value: string) => {
  const matches = value.match(/[0-9a-fA-F]{32}/g);

  if (!matches?.length) {
    return null;
  }

  return normalizeId(matches[matches.length - 1]);
};

export function parseNotionPublishTarget(input: string): NotionPublishTarget {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Enter a Notion page URL or page ID before publishing.");
  }

  const prefixedMatch = trimmed.match(/^(page_id|database_id|data_source_id)\s*:\s*(.+)$/i);

  if (prefixedMatch) {
    const type = prefixedMatch[1].toLowerCase() as NotionPublishTarget["type"];
    const id = normalizeId(prefixedMatch[2]) ?? extractIdFromUrl(prefixedMatch[2]);

    if (!id) {
      throw new Error("The provided Notion target is not a valid page, database, or data source ID.");
    }

    return {
      type,
      id,
      label: `${type}:${id}`,
    };
  }

  const pageId = normalizeId(trimmed) ?? extractIdFromUrl(trimmed);

  if (!pageId) {
    throw new Error("Enter a valid Notion page URL or 32-character page ID.");
  }

  return {
    type: "page_id",
    id: pageId,
    label: trimmed,
  };
}

export function getConfiguredPublishTarget(): NotionPublishTarget | null {
  const dataSourceId = process.env.NOTION_PARENT_DATA_SOURCE_ID;
  const databaseId = process.env.NOTION_PARENT_DATABASE_ID;
  const pageId = process.env.NOTION_PARENT_PAGE_ID;

  if (dataSourceId) {
    const normalized = normalizeId(dataSourceId);

    if (!normalized) {
      throw new Error("NOTION_PARENT_DATA_SOURCE_ID is not a valid Notion ID.");
    }

    return { type: "data_source_id", id: normalized, label: "Configured data source" };
  }

  if (databaseId) {
    const normalized = normalizeId(databaseId);

    if (!normalized) {
      throw new Error("NOTION_PARENT_DATABASE_ID is not a valid Notion ID.");
    }

    return { type: "database_id", id: normalized, label: "Configured database" };
  }

  if (pageId) {
    const normalized = normalizeId(pageId);

    if (!normalized) {
      throw new Error("NOTION_PARENT_PAGE_ID is not a valid Notion ID.");
    }

    return { type: "page_id", id: normalized, label: "Configured page" };
  }

  return null;
}

export function toNotionParent(target: NotionPublishTarget) {
  return {
    type: target.type,
    [target.type]: target.id,
  };
}