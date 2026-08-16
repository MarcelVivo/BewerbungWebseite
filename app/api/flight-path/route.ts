import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CandidatePoint = Record<string, unknown>;

const numberInRange = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

const validCurveHandle = (value: unknown) => {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  const handle = value as CandidatePoint;
  return numberInRange(handle.x, -200, 200)
    && numberInRange(handle.y, -200, 200)
    && numberInRange(handle.z, -2, 2);
};

function validPoint(point: CandidatePoint, { allowStartType = false }: { allowStartType?: boolean } = {}) {
  return typeof point.id === 'string'
    && point.id.length > 0
    && point.id.length < 80
    && numberInRange(point.sectionOffset, 0, 1)
    && numberInRange(point.x, 0, 100)
    && numberInRange(point.y, 0, 100)
    && numberInRange(point.scale, .1, 2)
    && numberInRange(point.rotation, -360, 360)
    && numberInRange(point.opacity, 0, 1)
    && (point.dockAnchor === undefined || typeof point.dockAnchor === 'string')
    && (point.dockNumber === undefined || typeof point.dockNumber === 'string')
    && (point.dockLabel === undefined || typeof point.dockLabel === 'string')
    && (point.dockLocked === undefined || typeof point.dockLocked === 'boolean')
    && (point.isTerminal === undefined || typeof point.isTerminal === 'boolean')
    && (point.type === undefined || point.type === 'control' || point.type === 'dock' || (allowStartType && point.type === 'start'))
    && (point.handleMode === undefined || point.handleMode === 'mirrored' || point.handleMode === 'aligned' || point.handleMode === 'free' || point.handleMode === 'corner')
    && validCurveHandle(point.curveIn)
    && validCurveHandle(point.curveOut);
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Editor ist nur lokal verfügbar.' }, { status: 403 });
  }
  const target = path.join(process.cwd(), 'components', 'experience', 'flight-path.json');
  const stored = JSON.parse(await fs.readFile(target, 'utf8')) as { followSpeed: number; start: CandidatePoint; points: CandidatePoint[] };
  return NextResponse.json(stored);
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Editor ist nur lokal verfügbar.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as null | { followSpeed?: unknown; start?: unknown; points?: unknown };
  const validStart = body && body.start && typeof body.start === 'object' && validPoint(body.start as CandidatePoint, { allowStartType: true });
  if (
    !body
    || !numberInRange(body.followSpeed, .1, 4)
    || !validStart
    || !Array.isArray(body.points)
    || body.points.length < 2
    || body.points.length > 100
    || !body.points.every((point) => point && typeof point === 'object' && validPoint(point as CandidatePoint))
  ) {
    return NextResponse.json({ ok: false, error: 'Ungültige Flugbahn.' }, { status: 400 });
  }
  const target = path.join(process.cwd(), 'components', 'experience', 'flight-path.json');
  await fs.writeFile(target, `${JSON.stringify({ followSpeed: body.followSpeed, start: body.start, points: body.points }, null, 2)}\n`, 'utf8');
  return NextResponse.json({ ok: true });
}
