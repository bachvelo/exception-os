import { describe, expect, it } from "vitest";
import { parseNotionPublishTarget, toNotionParent } from "./publish-target";

describe("parseNotionPublishTarget", () => {
  it("parses a raw Notion page id", () => {
    expect(parseNotionPublishTarget("123456781234123412341234567890ab")).toEqual({
      type: "page_id",
      id: "12345678-1234-1234-1234-1234567890ab",
      label: "123456781234123412341234567890ab",
    });
  });

  it("parses a Notion page url", () => {
    expect(parseNotionPublishTarget("https://www.notion.so/Exception-OS-123456781234123412341234567890ab?pvs=4")).toEqual({
      type: "page_id",
      id: "12345678-1234-1234-1234-1234567890ab",
      label: "https://www.notion.so/Exception-OS-123456781234123412341234567890ab?pvs=4",
    });
  });

  it("parses a prefixed database target", () => {
    expect(parseNotionPublishTarget("database_id:123456781234123412341234567890ab")).toEqual({
      type: "database_id",
      id: "12345678-1234-1234-1234-1234567890ab",
      label: "database_id:12345678-1234-1234-1234-1234567890ab",
    });
  });

  it("builds a Notion parent payload", () => {
    expect(
      toNotionParent({
        type: "page_id",
        id: "12345678-1234-1234-1234-1234567890ab",
      })
    ).toEqual({
      type: "page_id",
      page_id: "12345678-1234-1234-1234-1234567890ab",
    });
  });
});