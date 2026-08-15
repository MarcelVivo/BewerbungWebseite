import { NextResponse } from 'next/server';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

type DockConfig = {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  rotation: number;
  tilt: number;
  objectX: number;
  objectY: number;
};

const limits: Record<keyof DockConfig, [number, number]> = {
  x: [8, 92],
  y: [8, 92],
  scale: [.3, 1.2],
  width: [12, 70],
  height: [6, 48],
  rotation: [-32, 32],
  tilt: [0, 78],
  objectX: [-20, 20],
  objectY: [-20, 20],
};

const isDockConfig = (value: unknown): value is DockConfig => {
  if (!value || typeof value !== 'object') return false;
  return (Object.entries(limits) as [keyof DockConfig, [number, number]][]).every(([key, [min, max]]) => {
    const field = (value as Record<string, unknown>)[key];
    return typeof field === 'number' && Number.isFinite(field) && field >= min && field <= max;
  });
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Calibration saving is available in local development only.' }, { status: 403 });
  }

  const host = request.headers.get('host') ?? '';
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) {
    return NextResponse.json({ error: 'Local calibration only.' }, { status: 403 });
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!isDockConfig(payload)) {
    return NextResponse.json({ error: 'Invalid docking configuration.' }, { status: 400 });
  }

  const station = new URL(request.url).searchParams.get('station');
  const stationFiles: Record<string, string> = {
    hero: 'hero-dock.json',
    problem: 'problem-dock.json',
    system: 'system-dock.json',
    website: 'website-dock.json',
    marketing: 'marketing-dock.json',
    process: 'process-dock.json',
    data: 'data-dock.json',
    projects: 'projects-dock.json',
    about: 'about-dock.json',
    contact: 'contact-dock.json',
  };
  const filename = stationFiles[station ?? 'problem'] ?? 'problem-dock.json';
  const target = path.join(process.cwd(), 'components', 'experience', filename);
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return NextResponse.json({ ok: true, config: payload });
}
