import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { LOCK_DURATION_MS } from "@/lib/verification-policy";

export async function POST(_request: NextRequest) {
  try {
    const now = new Date();

    const deletedStale = await prisma.verifikasi_email.deleteMany({
      where: {
        expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        lockedUntil: null,
      },
    });

    const lockReleased = await prisma.verifikasi_email.updateMany({
      where: {
        lockedUntil: { lte: now },
        resendCount: { gte: 3 },
      },
      data: {
        lockedUntil: null,
        cooldownUntil: null,
        resendCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      deletedStaleRecords: deletedStale.count,
      releasedLocks: lockReleased.count,
      lockDurationHours: LOCK_DURATION_MS / (60 * 60 * 1000),
      message: `Cleanup: ${deletedStale.count} record lama dihapus, ${lockReleased.count} kunci dilepas.`,
    });
  } catch (error) {
    console.error("[POST /api/auth/cleanup-expired]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal melakukan cleanup kode expired",
      },
      { status: 500 }
    );
  }
}
