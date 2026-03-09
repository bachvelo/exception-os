import { NextResponse } from "next/server";
import { simulateSignal } from "@/lib/data";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(await simulateSignal());
}