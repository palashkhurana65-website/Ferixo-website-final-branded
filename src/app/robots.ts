import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // Applies to all search engines (Google, Bing, etc.)
      allow: '/', // Allow them to crawl the main site
      disallow: [
        '/admin/',       // Keep bots out of your admin panel
        '/api/',         // Keep bots out of your backend routes
        '/checkout/',    // No need to index checkout pages
      ],
    },
    sitemap: 'https://www.ferixo.com/sitemap.xml', // Points them directly to the file we just created
  };
}