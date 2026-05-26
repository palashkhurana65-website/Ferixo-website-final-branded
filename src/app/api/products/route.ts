import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { images, features, variants, ...basicInfo } = body;

    // 1. Insert Core Product
    const { data: newProduct, error: insertErr } = await supabase.from('Product').insert([{
      name: basicInfo.name, 
      shortName: basicInfo.shortName,
      description: basicInfo.description, 
      category: basicInfo.category, 
      basePrice: basicInfo.basePrice, 
      mrp: basicInfo.mrp, 
      stock: basicInfo.stock
    }]).select().single();
    
    if (insertErr || !newProduct) throw insertErr;
    const newId = newProduct.id;

    // 2. Insert Images & Features
    const validImages = images?.filter((url: string) => url.trim() !== "") || [];
    if (validImages.length > 0) await supabase.from('Image').insert(validImages.map((url: string) => ({ url, productId: newId })));
    
    const validFeatures = features?.filter((text: string) => text.trim() !== "") || [];
    if (validFeatures.length > 0) await supabase.from('Feature').insert(validFeatures.map((text: string) => ({ text, productId: newId })));

    // 3. Safe Insert Variants (Strips temp frontend IDs)
    if (variants && variants.length > 0) {
      const safeVariants = variants.map((v: any) => {
        const { id, ...rest } = v; // Remove the temporary ID
        return { ...rest, productId: newId };
      });
      
      const { error: variantErr } = await supabase.from('Variant').insert(safeVariants);
      if (variantErr) throw variantErr;
    }

    return NextResponse.json({ success: true, id: newId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}