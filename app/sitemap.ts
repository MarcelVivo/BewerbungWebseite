import type { MetadataRoute } from 'next';
import { SERVICES } from './leistungen/data';
import { PROJECTS } from './portfolio/data';
import { BLOG_POSTS } from './blog/data';

const BASE = 'https://www.marcelspahr.ch';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...SERVICES.map(s => ({
      url: `${BASE}/leistungen/${s.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...PROJECTS.map(project => ({
      url: `${BASE}/portfolio/${project.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...BLOG_POSTS.map(post => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
