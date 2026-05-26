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
      shortName: basicInfo.shortName, 
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

    // 3. Safe Upsert of Variants (Preserves Cart UUIDs & Passes new MRP)
    if (variants) {
      // Step A: Identify incoming valid UUIDs that we want to keep
      const incomingValidIds = variants
        .map((v: any) => v.id)
        .filter((vid: any) => typeof vid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vid));

      // Step B: Delete variants that belong to this product but were removed by the admin
      if (incomingValidIds.length > 0) {
        await supabase.from('Variant').delete().eq('productId', id).not('id', 'in', `(${incomingValidIds.join(',')})`);
      } else {
        await supabase.from('Variant').delete().eq('productId', id);
      }

      // Step C: Process and Upsert variants securely
      const variantsToUpsert = variants.map((v: any) => {
        const isValidUUID = typeof v.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.id);
        
        if (isValidUUID) {
          return { ...v, productId: id }; // Keep UUID to update existing row
        } else {
          const { id: tempId, ...rest } = v; // Strip temp ID to create a new row
          return { ...rest, productId: id };
        }
      });

      if (variantsToUpsert.length > 0) {
        const { error: upsertErr } = await supabase.from('Variant').upsert(variantsToUpsert);
        if (upsertErr) throw new Error(`Database rejected variants: ${upsertErr.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  await supabase.from('Product').delete().eq('id', id); // Cascades securely
  return NextResponse.json({ success: true });
}