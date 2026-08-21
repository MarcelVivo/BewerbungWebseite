import { BLOG_POSTS } from './data';
import BlogIndexContent from './BlogIndexContent';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Insights | Marcel Spahr',
  description: 'Fundierte Artikel zu Websites, CRM, ERP und KI-Automatisierung für Schweizer KMU – ohne Buzzwords, aus der Praxis.',
  alternates: { canonical: 'https://www.marcelspahr.ch/blog' },
  openGraph: {
    title: 'Insights von Marcel Spahr',
    description: 'Fundierte Artikel zu Websites, CRM, ERP und KI-Automatisierung für Schweizer KMU.',
    url: 'https://www.marcelspahr.ch/blog',
    type: 'website',
  },
};

export default function BlogIndexPage() {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        itemListElement: BLOG_POSTS.map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `https://www.marcelspahr.ch/blog/${post.slug}`,
          name: post.de.title,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Marcel Spahr', item: 'https://www.marcelspahr.ch' },
          { '@type': 'ListItem', position: 2, name: 'Insights', item: 'https://www.marcelspahr.ch/blog' },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <BlogIndexContent />
    </>
  );
}
