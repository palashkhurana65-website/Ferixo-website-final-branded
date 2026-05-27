import { createClient } from "../../../../lib/supabase/server";
import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ category: string, id: string }> }): Promise<Metadata> {
  const { id, category } = await params;
  const supabase = await createClient();
  
  const { data: product } = await supabase
    .from('Product')
    .select('name, description')
    .eq('id', id)
    .single();

  if (!product) {
    return { title: "Product Not Found | Ferixo" };
  }

  return {
    title: `${product.name} | Ferixo`,
    description: product.description?.substring(0, 160) || `Buy the premium ${product.name} at Ferixo.`,
    alternates: {
      canonical: `/shop/${category}/${id}`,
    },
    openGraph: {
      title: `${product.name} | Ferixo`,
      description: product.description?.substring(0, 160),
      type: "website",
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ category: string, id: string }> }) {
  return <ProductDetailClient params={params} />;
}