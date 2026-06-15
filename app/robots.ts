import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/login', '/recruiter/'],
    },
    sitemap: 'https://www.marcelspahr.ch/sitemap.xml',
    host: 'https://www.marcelspahr.ch',
  };
}
