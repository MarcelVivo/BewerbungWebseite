import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getSessionFromCookies } from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DocumentDefinition = {
  path: string[];
  filename: string;
  contentType: string;
  disposition?: 'inline' | 'attachment';
};

const DOCUMENTS: Record<string, DocumentDefinition> = {
  'cv-pdf': {
    path: ['private', 'expertise', 'Lebenslauf_Marcel_Spahr_2026.pdf'],
    filename: 'Lebenslauf_Marcel_Spahr_2026.pdf',
    contentType: 'application/pdf',
  },
  'cv-word': {
    path: ['private', 'expertise', 'Lebenslauf_Marcel_Spahr_2026.docx'],
    filename: 'Lebenslauf_Marcel_Spahr_2026.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    disposition: 'attachment',
  },
  ireb: {
    path: ['public', 'assets', 'IREB_Zertifikat_Spahr_Marcel.pdf'],
    filename: 'IREB_CPRE_Foundation_Level_Marcel_Spahr.pdf',
    contentType: 'application/pdf',
  },
  scrum: {
    path: ['public', 'assets', 'SCRUMZertifikat.pdf'],
    filename: 'Professional_Scrum_Master_I_Marcel_Spahr.pdf',
    contentType: 'application/pdf',
  },
  safe: {
    path: ['public', 'assets', 'SAFeZertifikatMarcelSpahr.pdf'],
    filename: 'SAFe_6_Agilist_Marcel_Spahr.pdf',
    contentType: 'application/pdf',
  },
  cambridge: {
    path: ['public', 'assets', 'CambridgeEnglischA2ZertifikatMarcelSpahr.pdf'],
    filename: 'Cambridge_English_A2_Marcel_Spahr.pdf',
    contentType: 'application/pdf',
  },
  'swisscom-reference': {
    path: ['public', 'assets', 'ArbeitszeugnisSwisscomMarcelSpahr2025.pdf'],
    filename: 'Arbeitszeugnis_Swisscom_Marcel_Spahr_2025.pdf',
    contentType: 'application/pdf',
  },
  'requirements-project': {
    path: ['public', 'assets', 'FinalArbeitSoftwareundRequirementsEngineering.pdf'],
    filename: 'Projektarbeit_Software_Requirements_Engineering.pdf',
    contentType: 'application/pdf',
  },
  'covid-architecture': {
    path: ['public', 'assets', 'SWISS_COVID_CERT_APP_SoftwareArchitektur.pdf'],
    filename: 'Projektarbeit_Softwarearchitektur.pdf',
    contentType: 'application/pdf',
  },
  olivia: {
    path: ['public', 'assets', 'OliviasOlivenpaste_MarcelSpahr.pdf'],
    filename: 'Projektarbeit_Olivias_Olivenpaste.pdf',
    contentType: 'application/pdf',
  },
  leadership: {
    path: ['public', 'assets', 'Personliches_Fuhrungshandbuch_MarcelSpahr.pdf'],
    filename: 'Persoenliches_Fuehrungshandbuch_Marcel_Spahr.pdf',
    contentType: 'application/pdf',
  },
};

function contentDisposition(disposition: 'inline' | 'attachment', filename: string) {
  const encoded = encodeURIComponent(filename);
  return `${disposition}; filename="${filename}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const session = getSessionFromCookies();
  if (!session) {
    return Response.json(
      { error: 'Nicht autorisiert.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const definition = DOCUMENTS[params.slug];
  if (!definition) {
    return Response.json({ error: 'Dokument nicht gefunden.' }, { status: 404 });
  }

  try {
    const file = await readFile(path.join(process.cwd(), ...definition.path));
    return new Response(file, {
      headers: {
        'Content-Type': definition.contentType,
        'Content-Disposition': contentDisposition(definition.disposition ?? 'inline', definition.filename),
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error(`Expertise document could not be read: ${params.slug}`, error);
    return Response.json({ error: 'Dokument derzeit nicht verfügbar.' }, { status: 503 });
  }
}
