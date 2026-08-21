import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function assertDashboardUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const adminEmail = process.env.DASHBOARD_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  }
  return null;
}

type CostBucket = { date: string; amountUsd: number };

export async function GET() {
  const authError = await assertDashboardUser();
  if (authError) return authError;

  const adminKey = process.env.OPENAI_ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { error: 'OPENAI_ADMIN_API_KEY ist nicht gesetzt. Ohne Admin-Key kann OpenAI keine Kostendaten herausgeben.' },
      { status: 503 },
    );
  }

  const days = 30;
  const now = new Date();
  const startTime = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)).getTime() / 1000);

  try {
    const url = new URL('https://api.openai.com/v1/organization/costs');
    url.searchParams.set('start_time', String(startTime));
    url.searchParams.set('bucket_width', '1d');
    url.searchParams.set('limit', String(days + 1));

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${adminKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error('[dashboard:usage] OpenAI error', response.status, payload?.error?.message);
      const hint = response.status === 401 || response.status === 403
        ? 'Der Admin-Key ist ungültig oder hat keine Berechtigung für Usage/Costs.'
        : 'OpenAI hat die Anfrage abgelehnt.';
      return NextResponse.json({ error: hint }, { status: 502 });
    }

    const buckets = Array.isArray(payload.data) ? payload.data : [];
    const perDay: CostBucket[] = buckets.map((bucket: any) => {
      const amount = Array.isArray(bucket.results)
        ? bucket.results.reduce((sum: number, r: any) => sum + (r?.amount?.value ?? 0), 0)
        : 0;
      return { date: new Date((bucket.start_time ?? 0) * 1000).toISOString().slice(0, 10), amountUsd: amount };
    });

    const totalUsd = perDay.reduce((sum, d) => sum + d.amountUsd, 0);

    return NextResponse.json({
      totalUsd,
      currency: 'usd',
      periodDays: days,
      perDay,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[dashboard:usage] failed', err instanceof Error ? err.message : 'unknown error');
    return NextResponse.json({ error: 'OpenAI-Nutzungsdaten aktuell nicht erreichbar.' }, { status: 500 });
  }
}
