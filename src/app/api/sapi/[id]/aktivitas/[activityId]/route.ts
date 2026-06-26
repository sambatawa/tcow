import { NextRequest, NextResponse } from "next/server";
import { deleteActivity, updateActivity } from "@/lib/sapi-service";
import type { ActivityInput } from "@/lib/sapi";
import { getAuthUser } from "@/lib/auth-guard";

type RouteParams = { params: Promise<{ id: string; activityId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, activityId } = await params;

  try {
    const body = (await request.json()) as Partial<ActivityInput>;
    const activity = await updateActivity(id, activityId, body);

    if (!activity) {
      return NextResponse.json(
        { error: "Aktivitas tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ activity });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui aktivitas" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = getAuthUser(_request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, activityId } = await params;

  try {
    const deleted = await deleteActivity(id, activityId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Aktivitas tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus aktivitas" },
      { status: 500 }
    );
  }
}
