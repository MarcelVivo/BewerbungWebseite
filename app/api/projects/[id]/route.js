import { NextResponse } from 'next/server';
import { requireOwner } from '../../../../lib/auth';
import { normalizeUpdate, readProjects, writeProjects } from '../../../../lib/projects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
  const session = requireOwner();
  if (!session) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  try {
    const items = await readProjects();
    const next = items.filter((x) => x.id !== params.id);
    if (next.length === items.length) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    const updated = await writeProjects(next);
    return NextResponse.json({ ok: true, items: updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'Delete failed' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = requireOwner();
  if (!session) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const patch = normalizeUpdate(body);
  try {
    const items = await readProjects();
    let found = false;
    const next = items.map((it) => {
      if (it.id !== params.id) return it;
      found = true;
      return { ...it, ...patch };
    });
    if (!found) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    const updated = await writeProjects(next);
    const item = updated.find((x) => x.id === params.id);
    return NextResponse.json({ ok: true, item, items: updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'Update failed' }, { status: 500 });
  }
}
