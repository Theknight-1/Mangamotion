// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) continue;

      const buffer = Buffer.from(await file.arrayBuffer());

      // Use sharp to get metadata and optimize the image
      const metadata = await sharp(buffer).metadata();
      const optimizedBuffer = await sharp(buffer)
        .resize(2160, 2160, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const blobPath = `uploads/${userId}/${safeName}`;

      const blob = await put(blobPath, optimizedBuffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
      });

      uploadedFiles.push({
        url: blob.url,
        name: file.name,
        size: optimizedBuffer.length,
        width: metadata.width,
        height: metadata.height,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}