import { NextResponse } from 'next/server';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PerspectivePoint = { x: number; y: number };

type DetailCardConfig = {
  points: [PerspectivePoint, PerspectivePoint, PerspectivePoint, PerspectivePoint];
  width: number;
  height: number;
  float: number;
};

const limits = {
  width: [440, 820],
  height: [480, 820],
  float: [0, 16],
} as const;

const isPoint = (value: unknown): value is PerspectivePoint => {
  if (!value || typeof value !== 'object') return false;
  const point = value as Record<string, unknown>;
  return typeof point.x === 'number' && Number.isFinite(point.x) && point.x >= -4 && point.x <= 104
    && typeof point.y === 'number' && Number.isFinite(point.y) && point.y >= -4 && point.y <= 104;
};

const isDetailCardConfig = (value: unknown): value is DetailCardConfig => {
  if (!value || typeof value !== 'object') return false;
  const config = value as Record<string, unknown>;
  if (!Array.isArray(config.points) || config.points.length !== 4 || !config.points.every(isPoint)) return false;
  return (Object.entries(limits) as [keyof typeof limits, readonly [number, number]][]).every(([key, [min, max]]) => {
    const field = config[key];
    return typeof field === 'number' && Number.isFinite(field) && field >= min && field <= max;
  });
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Detail-card calibration is available in local development only.' }, { status: 403 });
  }

  const host = request.headers.get('host') ?? '';
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) {
    return NextResponse.json({ error: 'Local calibration only.' }, { status: 403 });
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!isDetailCardConfig(payload)) {
    return NextResponse.json({ error: 'Invalid detail-card configuration.' }, { status: 400 });
  }

  const target = path.join(process.cwd(), 'components', 'experience', 'detail-card-config.json');
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return NextResponse.json({ ok: true, config: payload });
}
