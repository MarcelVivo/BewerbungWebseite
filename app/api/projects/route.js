import { NextResponse } from 'next/server';
import { getSessionFromCookies, requireOwner } from '../../../lib/auth';
import { createProject, readProjects, writeProjects } from '../../../lib/projects';

export async function GET() {
  const session = getSessionFromCookies();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const items = await readProjects();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request) {
  const session = requireOwner();
  if (!session) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  if (!body.title && !body.url) {
    return NextResponse.json({ ok: false, error: 'Titel oder URL erforderlich' }, { status: 400 });
  }
  const items = await readProjects();
  const item = createProject(body);
  const updated = await writeProjects([item, ...items]);
  return NextResponse.json({ ok: true, item, items: updated });
}
