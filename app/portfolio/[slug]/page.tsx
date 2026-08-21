import { notFound } from 'next/navigation';
import { PROJECTS, getProject } from '../data';
import PortfolioDetailContent from './PortfolioDetailContent';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return PROJECTS.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.de.title} | Marcel Spahr`,
    description: project.de.metaDesc,
    alternates: { canonical: `https://www.marcelspahr.ch/portfolio/${project.slug}` },
    openGraph: {
      title: `${project.de.title} | Digitalstudio Marcel Spahr`,
      description: project.de.metaDesc,
      url: `https://www.marcelspahr.ch/portfolio/${project.slug}`,
      type: 'article',
      images: [{ url: `https://www.marcelspahr.ch${project.image}` }],
    },
  };
}

export default async function PortfolioDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const projectJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        name: project.de.title,
        headline: project.de.tagline,
        description: project.de.metaDesc,
        url: `https://www.marcelspahr.ch/portfolio/${project.slug}`,
        image: `https://www.marcelspahr.ch${project.image}`,
        creator: {
          '@type': 'Person',
          name: 'Marcel Spahr',
          url: 'https://www.marcelspahr.ch',
        },
        about: project.de.tag,
        ...(project.externalUrl ? { sameAs: [project.externalUrl] } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Marcel Spahr', item: 'https://www.marcelspahr.ch' },
          { '@type': 'ListItem', position: 2, name: 'Portfolio', item: 'https://www.marcelspahr.ch/#journey-references' },
          { '@type': 'ListItem', position: 3, name: project.de.title, item: `https://www.marcelspahr.ch/portfolio/${project.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd) }}
      />
      <PortfolioDetailContent slug={slug} />
    </>
  );
}
