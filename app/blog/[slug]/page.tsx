import { notFound } from 'next/navigation';
import { BLOG_POSTS, getBlogPost } from '../data';
import BlogPostContent from './BlogPostContent';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: `${post.de.title} | Marcel Spahr`,
    description: post.de.metaDesc,
    alternates: { canonical: `https://www.marcelspahr.ch/blog/${post.slug}` },
    openGraph: {
      title: post.de.title,
      description: post.de.metaDesc,
      url: `https://www.marcelspahr.ch/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: post.de.title,
        description: post.de.metaDesc,
        datePublished: post.date,
        dateModified: post.date,
        inLanguage: 'de-CH',
        url: `https://www.marcelspahr.ch/blog/${post.slug}`,
        author: { '@type': 'Person', name: 'Marcel Spahr', url: 'https://www.marcelspahr.ch' },
        publisher: { '@type': 'Person', name: 'Marcel Spahr', url: 'https://www.marcelspahr.ch' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Marcel Spahr', item: 'https://www.marcelspahr.ch' },
          { '@type': 'ListItem', position: 2, name: 'Insights', item: 'https://www.marcelspahr.ch/blog' },
          { '@type': 'ListItem', position: 3, name: post.de.title, item: `https://www.marcelspahr.ch/blog/${post.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogPostContent slug={slug} />
    </>
  );
}
