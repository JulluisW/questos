/**
 * The site's own public address, used for absolute URLs in metadata,
 * robots.txt and the sitemap. No domain is hard-coded:
 *   1. NEXT_PUBLIC_SITE_URL, once a domain exists
 *   2. the production URL Vercel sets on every deployment
 *   3. localhost for development
 */
function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return new URL('http://localhost:3000');
}

export const siteUrl = resolveSiteUrl();
