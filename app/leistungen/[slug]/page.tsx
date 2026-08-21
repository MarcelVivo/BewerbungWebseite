import { notFound } from 'next/navigation';
import { SERVICES, getService } from '../data';
import ServicePageContent from './ServicePageContent';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return SERVICES.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return {};
  return {
    title: `${s.de.title} Schweiz | Marcel Spahr`,
    description: s.de.metaDesc,
    alternates: { canonical: `https://www.marcelspahr.ch/leistungen/${s.slug}` },
    openGraph: {
      title: `${s.de.title}. Marcel Spahr.`,
      description: s.de.metaDesc,
      url: `https://www.marcelspahr.ch/leistungen/${s.slug}`,
      type: 'website',
    },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) notFound();

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: s.de.title,
        description: s.de.metaDesc,
        url: `https://www.marcelspahr.ch/leistungen/${s.slug}`,
        provider: {
          '@type': 'Person',
          name: 'Marcel Spahr',
          url: 'https://www.marcelspahr.ch',
          address: { '@type': 'PostalAddress', addressLocality: 'Bern', addressCountry: 'CH' },
        },
        areaServed: { '@type': 'Country', name: 'Schweiz' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Marcel Spahr', item: 'https://www.marcelspahr.ch' },
          { '@type': 'ListItem', position: 2, name: 'Leistungen', item: 'https://www.marcelspahr.ch/#journey-solutions' },
          { '@type': 'ListItem', position: 3, name: s.de.title, item: `https://www.marcelspahr.ch/leistungen/${s.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <ServicePageContent slug={slug} />
    </>
  );
}
