import { NextRequest, NextResponse } from "next/server";
import { createActivity, listActivitiesForCattle } from "@/lib/sapi-service";
import type { ActivityInput } from "@/lib/sapi";
import { getAuthUser } from "@/lib/auth-guard";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = getAuthUser(_request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const activities = await listActivitiesForCattle(id);
    return NextResponse.json({ activities });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat log aktivitas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as ActivityInput;

    if (!body.kategori || !body.date) {
      return NextResponse.json(
        { error: "Kategori dan tanggal wajib diisi" },
        { status: 400 }
      );
    }

    const activity = await createActivity(id, body);
    if (!activity) {
      return NextResponse.json({ error: "Sapi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menambahkan aktivitas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
