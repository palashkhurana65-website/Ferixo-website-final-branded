import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: product, error } = await supabase.from('Product').select('*, Image(*), Feature(*), Variant(*)').eq('id', id).single();
    if (error || !product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...product, images: product.Image?.map((i: any) => i.url) || [], features: product.Feature?.map((f: any) => f.text) || [], variants: product.Variant || [] });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { images, features, variants, ...basicInfo } = body;

    
    // 1. Update Core Product
    const { error: updateErr } = await supabase.from('Product').update({
      name: basicInfo.name, 
      shortName: basicInfo.shortName, // <-- ADDED THIS LINE
      description: basicInfo.description, 
      category: basicInfo.category, 
      basePrice: basicInfo.basePrice, 
      mrp: basicInfo.mrp, 
      stock: basicInfo.stock
    }).eq('id', id);
    if (updateErr) throw updateErr;

    // 2. Safe Rebuild of Images & Features
    await supabase.from('Image').delete().eq('productId', id);
    await supabase.from('Feature').delete().eq('productId', id);
    
    const validImages = images?.filter((url: string) => url.trim() !== "") || [];
    if (validImages.length > 0) await supabase.from('Image').insert(validImages.map((url: string) => ({ url, productId: id })));
    
    const validFeatures = features?.filter((text: string) => text.trim() !== "") || [];
    if (validFeatures.length > 0) await supabase.from('Feature').insert(validFeatures.map((text: string) => ({ text, productId: id })));

    // 3. Safe Upsert of Variants
    if (variants && variants.length > 0) {
      // Delete old variants first
      const { error: deleteErr } = await supabase.from('Variant').delete().eq('productId', id);
      if (deleteErr) throw new Error(`Failed to clear old variants: ${deleteErr.message}`);

      // Map and insert new variants
      const safeVariants = variants.map((v: any) => {
        const { id: oldId, ...variantData } = v; 
        return { ...variantData, productId: id };
      });
      
      const { error: insertErr } = await supabase.from('Variant').insert(safeVariants);
      
      // THIS IS THE FIX: Strict error checking for the insert
      if (insertErr) {
        console.error("Variant Insert Error:", insertErr); // Logs to your VS Code terminal
        throw new Error(`Database rejected variants: ${insertErr.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  await supabase.from('Product').delete().eq('id', id); // Cascades securely
  return NextResponse.json({ success: true });
}