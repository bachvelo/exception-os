import { NextResponse } from "next/server";
import { getNotionStatus, savePublishTarget } from "@/lib/notion/adapter";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { value?: string };

    if (!body.value) {
      return NextResponse.json({ error: "A Notion page URL or page ID is required." }, { status: 400 });
    }

    await savePublishTarget(body.value);

    return NextResponse.json(await getNotionStatus());
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save the Notion publish target.",
      },
      { status: 400 }
    );
  }
}