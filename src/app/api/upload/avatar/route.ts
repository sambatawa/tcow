import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const uid = formData.get("uid");

    if (!(file instanceof File) || typeof uid !== "string" || !uid.trim()) {
      return NextResponse.json(
        { error: "File dan uid wajib diisi" },
        { status: 400 }
      );
    }

    const isJpeg =
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      /\.jpe?g$/i.test(file.name);

    if (!isJpeg) {
      return NextResponse.json(
        { error: "Hanya file JPG/JPEG yang diperizinkan" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 2 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", "pengguna");
    await mkdir(dir, { recursive: true });

    const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, "");
    const filename = `${safeUid}.jpg`;
    await writeFile(path.join(dir, filename), buffer);

    const url = `/uploads/pengguna/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[POST /api/upload/avatar]", error);
    return NextResponse.json(
      { error: "Gagal mengunggah foto" },
      { status: 500 }
    );
  }
}
