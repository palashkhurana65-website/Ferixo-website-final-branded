import { MetadataRoute } from 'next';
import { createClient } from '../lib/supabase/server'; // Adjust this path to your actual Supabase server client

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.ferixo.com';
  const supabase = await createClient();

  // 1. Fetch all active products
  // We only need the ID, Category, and when it was created/updated for the sitemap
  const { data: products } = await supabase
    .from('Product')
    .select('id, category, createdAt');

  // 2. Map your dynamic product pages
  const productUrls = (products || []).map((product) => ({
    url: `${baseUrl}/shop/${product.category.toLowerCase().replace(/\s+/g, '-')}/${product.id}`,
    lastModified: new Date(product.createdAt || new Date()), // Tells Google when the page was last updated
    changeFrequency: 'weekly' as const,
    priority: 0.8, // High priority for product pages
  }));

  // 3. Define your static core pages
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0, // Homepage is highest priority
    },
    {
      url: `${baseUrl}/shop/all`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/bottles`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/tumblers`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/coffee-cups`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  // Combine and return them
  return [...staticUrls, ...productUrls];
}