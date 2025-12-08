import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireOwner } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use /tmp on Vercel (read-only file system), otherwise write into public/uploads locally.
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'public', 'uploads');

function safeName(name = '') {
  return name
    .replace(/[^a-z0-9.\-_]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'upload.pdf';
}

export async function POST(request) {
  const session = requireOwner();
  if (!session) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ ok: false, error: 'Keine Datei übergeben' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const original = safeName(file.name);
    const filename = `${Date.now()}-${original}`;
    await fs.mkdir(uploadDir, { recursive: true });
    const target = path.join(uploadDir, filename);
    await fs.writeFile(target, buffer);
    const url = `/api/upload?file=${encodeURIComponent(filename)}`;
    return NextResponse.json({ ok: true, file: { name: filename, size: buffer.byteLength, url } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'Upload failed' }, { status: 500 });
  }
}

export async function GET(request) {
  const fileParam = request.nextUrl.searchParams.get('file') || '';
  if (!fileParam) return NextResponse.json({ ok: false, error: 'file param missing' }, { status: 400 });
  try {
    const name = path.basename(fileParam);
    const filePath = path.join(uploadDir, name);
    const data = await fs.readFile(filePath);
    const ct = name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Content-Disposition': `inline; filename="${name}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'Not found' }, { status: 404 });
  }
}
