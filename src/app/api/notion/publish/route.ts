import { NextResponse } from "next/server";
import { getDecisionPayload } from "@/lib/data";
import { getNotionStatus, publishDecisionToNotion } from "@/lib/notion/adapter";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { exceptionId?: string };

    if (!body.exceptionId) {
      return NextResponse.json({ error: "exceptionId is required." }, { status: 400 });
    }

    const payload = await getDecisionPayload(body.exceptionId);

    if (!payload) {
      return NextResponse.json({ error: "The selected exception could not be resolved." }, { status: 404 });
    }

    const result = await publishDecisionToNotion(payload);

    return NextResponse.json({
      result,
      status: await getNotionStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to publish the decision brief to Notion.",
      },
      { status: 400 }
    );
  }
}