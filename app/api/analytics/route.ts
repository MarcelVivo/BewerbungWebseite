import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validatePublicPost } from '@/app/lib/security';

const EVENT_NAMES = new Set([
  'page_view', 'page_exit', 'journey_station_view', 'journey_navigation',
  'cta_click', 'form_open', 'form_start', 'form_step', 'form_submit',
  'form_success', 'form_error',
  'aila_opened', 'aila_message_sent', 'aila_voice_used',
  'aila_industry_detected', 'aila_problem_detected', 'aila_solution_shown',
  'aila_service_clicked', 'aila_contact_requested', 'aila_booking_started',
  'aila_handover',
]);
const FORM_IDS = new Set(['consultation', 'project', 'ki']);
const META_KEYS = new Set([
  'duration_seconds', 'station_index', 'from_station', 'to_station', 'error_type',
  'input_mode', 'stage', 'lead_temperature', 'service_id', 'service_count',
  'detected',
]);

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) || null : null;
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key, entry]) => META_KEYS.has(key) && ['string', 'number', 'boolean'].includes(typeof entry))
    .map(([key, entry]) => [key, typeof entry === 'string' ? entry.slice(0, 100) : entry]));
}

export async function POST(request: NextRequest) {
  const rejected = validatePublicPost(request, {
    key: 'analytics',
    limit: 90,
    windowMs: 60_000,
    contentTypes: ['application/json'],
    maxBytes: 8_000,
  });
  if (rejected) return rejected;

  try {
    const body = await request.json();
    if (!EVENT_NAMES.has(body.eventName) || typeof body.visitId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.visitId)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return new NextResponse(null, { status: 202 });

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const formId = FORM_IDS.has(body.formId) ? body.formId : null;
    const { error } = await supabase.from('website_events').insert({
      event_name: body.eventName,
      visit_id: body.visitId,
      sequence: Number.isInteger(body.sequence) ? Math.max(1, body.sequence) : 1,
      page_path: text(body.pagePath, 240) ?? '/',
      language: body.language === 'en' ? 'en' : 'de',
      station: text(body.station, 80),
      form_id: formId,
      cta_id: text(body.ctaId, 100),
      step: Number.isInteger(body.step) ? Math.max(0, Math.min(100, body.step)) : null,
      source: text(body.source, 160),
      medium: text(body.medium, 160),
      campaign: text(body.campaign, 160),
      referrer_host: text(body.referrerHost, 200),
      metadata: safeMetadata(body.metadata),
    });

    if (error) {
      console.error('Website analytics insert failed:', error.message);
      return new NextResponse(null, { status: 202 });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
