import type { MetadataRoute } from 'next';
import { SERVICES } from './leistungen/data';
import { PROJECTS } from './portfolio/data';

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
  ];
}
