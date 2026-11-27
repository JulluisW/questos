import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

/** Only the public pages; everything else needs a session. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/login', '/signup'].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: 'yearly',
  }));
}
