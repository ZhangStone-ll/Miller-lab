import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const lawKey = formData.get('lawKey') as string | null;
    const chapterIndex = formData.get('chapterIndex') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      'video/mp4', 'video/webm', 'video/ogg',
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml',
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    // Ensure videos directory exists
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    // Generate filename: {lawKey}-ch{chapterIndex}-{timestamp}.{ext}
    const ext = file.name.split('.').pop() || 'mp4';
    const timestamp = Date.now();
    const safeName = `${lawKey || 'unknown'}-ch${chapterIndex || '0'}-${timestamp}.${ext}`;
    const filePath = path.join(videosDir, safeName);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Return the public URL path
    const publicUrl = `/videos/${safeName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: file.name,
      size: file.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl || !fileUrl.startsWith('/videos/')) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', fileUrl);

    // Security: ensure the path is within public/videos
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    if (!filePath.startsWith(videosDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
