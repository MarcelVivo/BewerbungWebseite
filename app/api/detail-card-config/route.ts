import { NextResponse } from 'next/server';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DetailCardConfig = {
  x: number;
  y: number;
  depth: number;
  scale: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  width: number;
  height: number;
  float: number;
};

const limits: Record<keyof DetailCardConfig, [number, number]> = {
  x: [650, 1450],
  y: [-600, 120],
  depth: [-300, 500],
  scale: [.55, 1.45],
  rotateX: [-22, 22],
  rotateY: [-22, 22],
  rotateZ: [-18, 18],
  width: [440, 820],
  height: [480, 820],
  float: [0, 16],
};

const isDetailCardConfig = (value: unknown): value is DetailCardConfig => {
  if (!value || typeof value !== 'object') return false;
  return (Object.entries(limits) as [keyof DetailCardConfig, [number, number]][]).every(([key, [min, max]]) => {
    const field = (value as Record<string, unknown>)[key];
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
