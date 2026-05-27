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
    // 1. RENAME VARIABLE TO PREVENT SHADOWING
    const { id: productId } = await params; 
    
    const supabase = await createClient();
    const body = await request.json();
    const { images, features, variants, ...basicInfo } = body;

    // 2. Update Core Product
    const { error: updateErr } = await supabase.from('Product').update({
      name: basicInfo.name, 
      shortName: basicInfo.shortName, 
      description: basicInfo.description, 
      category: basicInfo.category, 
      basePrice: basicInfo.basePrice, 
      mrp: basicInfo.mrp, 
      stock: basicInfo.stock
    }).eq('id', productId); // Use new variable name
    
    if (updateErr) throw updateErr;

    // 3. Safe Rebuild of Images & Features
    await supabase.from('Image').delete().eq('productId', productId);
    await supabase.from('Feature').delete().eq('productId', productId);
    
    const validImages = images?.filter((url: string) => url.trim() !== "") || [];
    if (validImages.length > 0) {
      await supabase.from('Image').insert(validImages.map((url: string) => ({ url, productId: productId })));
    }
    
    const validFeatures = features?.filter((text: string) => text.trim() !== "") || [];
    if (validFeatures.length > 0) {
      await supabase.from('Feature').insert(validFeatures.map((text: string) => ({ text, productId: productId })));
    }

    // 4. Strict Isolation Variant Processing
    // 4. Strict Isolation Variant Processing
    if (variants && Array.isArray(variants)) {
      const toUpdate: any[] = [];
      const toInsert: any[] = [];
      const keptIds: string[] = []; // Track IDs we want to keep

      variants.forEach((v: any) => {
        const isValidUUID = typeof v.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.id);

        if (isValidUUID) {
          toUpdate.push({ ...v, productId: productId });
          keptIds.push(v.id); // Add valid UUIDs to the safe list
        } else {
          const { id: _tempId, ...newVariant } = v; 
          toInsert.push({ ...newVariant, productId: productId });
        }
      });

      // A: Cleanup Database FIRST (Delete anything removed in the UI)
      // Doing this first ensures we don't accidentally delete the new variants we are about to insert
      if (keptIds.length > 0) {
        await supabase.from('Variant').delete().eq('productId', productId).not('id', 'in', `(${keptIds.join(',')})`);
      } else {
        // If all old variants were deleted (or there were none to begin with)
        await supabase.from('Variant').delete().eq('productId', productId);
      }

      // B: Process Updates Second
      if (toUpdate.length > 0) {
        const { error: variantUpdateErr } = await supabase.from('Variant').upsert(toUpdate);
        if (variantUpdateErr) throw new Error(`Failed to update existing variants: ${variantUpdateErr.message}`);
      }

      // C: Process Inserts Third
      if (toInsert.length > 0) {
        const { error: variantInsertErr } = await supabase.from('Variant').insert(toInsert);
        if (variantInsertErr) throw new Error(`Failed to insert new variants: ${variantInsertErr.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Critical PUT Error:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  await supabase.from('Product').delete().eq('id', id); // Cascades securely
  return NextResponse.json({ success: true });
}