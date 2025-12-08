import { NextResponse } from 'next/server';
import { getSessionFromCookies, requireOwner } from '../../../lib/auth';
import { createProject, readProjects, writeProjects } from '../../../lib/projects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSessionFromCookies();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const items = await readProjects();
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'Read failed' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = requireOwner();
  if (!session) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  if (!body.title && !body.url) {
    return NextResponse.json({ ok: false, error: 'Titel oder URL erforderlich' }, { status: 400 });
  }
  try {
    const items = await readProjects();
    const item = createProject(body);
    const updated = await writeProjects([item, ...items]);
    return NextResponse.json({ ok: true, item, items: updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'Write failed' }, { status: 500 });
  }
}
