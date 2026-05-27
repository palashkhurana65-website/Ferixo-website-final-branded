import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  // Fetch all products and their images
  const { data: products } = await supabase
    .from('Product')
    .select('*, Image(url)');

  const baseUrl = "https://ferixo.com";

  // Build the XML Header
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
  xml += `<channel>\n`;
  xml += `<title>Ferixo</title>\n`;
  xml += `<link>${baseUrl}</link>\n`;
  xml += `<description>Premium Engineered Gear</description>\n`;

  // Loop through your Supabase database and format for Google
  if (products) {
    products.forEach(product => {
      // Recreate your dynamic URL slug math
      const categorySlug = product.category ? product.category.toLowerCase().replace(/\s+/g, '-') : 'all';
      const productLink = `${baseUrl}/shop/${categorySlug}/${product.id}`;
      const rawImageUrl = product.Image?.[0]?.url || "/placeholder.png";
      const imageLink = rawImageUrl.startsWith("http") ? rawImageUrl : `${baseUrl}${rawImageUrl}`;
      const availability = product.stock > 0 ? "in_stock" : "out_of_stock";

      xml += `<item>\n`;
      xml += `  <g:id>${product.id}</g:id>\n`;
      xml += `  <g:title><![CDATA[${product.name}]]></g:title>\n`;
      xml += `  <g:description><![CDATA[${product.description}]]></g:description>\n`;
      xml += `  <g:link>${productLink}</g:link>\n`;
      xml += `  <g:image_link>${imageLink}</g:image_link>\n`;
      xml += `  <g:condition>new</g:condition>\n`;
      xml += `  <g:availability>${availability}</g:availability>\n`;
      xml += `  <g:price>${product.basePrice} INR</g:price>\n`;
      xml += `  <g:brand>Ferixo</g:brand>\n`;
      xml += `</item>\n`;
    });
  }

  // Close the XML
  xml += `</channel>\n`;
  xml += `</rss>`;

  // Return as a raw XML file
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}