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
  return <PortfolioDetailContent slug={slug} />;
}
