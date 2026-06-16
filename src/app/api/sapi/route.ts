import { NextResponse } from "next/server";
import { buildSapiBundle } from "@/lib/sapi-service";

export async function GET() {
  try {
    const data = await buildSapiBundle();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/sapi]", error);
    return NextResponse.json(
      { error: "Gagal memuat data sapi" },
      { status: 500 }
    );
  }
}
