import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

// 📌 READ-ME: robots.txt is advice for well-behaved crawlers, not access
// control. Signed-out visitors are still redirected by the proxy, and RLS still
// decides what each user can read.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/login', '/signup'],
      disallow: ['/dashboard', '/campaigns', '/board', '/team', '/records', '/join'],
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  };
}
