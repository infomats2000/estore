import crypto from 'node:crypto';

export interface SeoMetadata {
  slug: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  structuredData?: Record<string, unknown>;
}

export const buildSeoMetadata = (title: string, description: string, slug: string): SeoMetadata => {
  const safeSlug = slug.replace(/\s+/g, '-').toLowerCase();
  return {
    slug: safeSlug,
    title: title || 'Tech Seller',
    description: description || 'Premium refurbished hardware and electronics.',
    ogTitle: title || 'Tech Seller',
    ogDescription: description || 'Premium refurbished hardware and electronics.',
    canonicalUrl: `https://techseller.com.au/${safeSlug}`,
    imageUrl: '/uploads/store/og-default.png',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Tech Seller',
      url: 'https://techseller.com.au'
    }
  };
};

export const buildRobotsTxt = () => `User-agent: *\nAllow: /\nSitemap: https://techseller.com.au/sitemap.xml\n`;

export const buildSitemapXml = (urls: string[]) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}\n</urlset>`;
