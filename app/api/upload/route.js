import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireOwner } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

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
    const url = `/uploads/${filename}`;
    return NextResponse.json({ ok: true, file: { name: filename, size: buffer.byteLength, url } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'Upload failed' }, { status: 500 });
  }
}
