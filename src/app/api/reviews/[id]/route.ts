import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// It is highly recommended to add SUPABASE_SERVICE_ROLE_KEY to your .env.local 
// so the admin panel can bypass all database security rules to delete files.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(req: Request) {
  try {
    // 🚀 FIX: Next.js version-agnostic ID extraction
    const id = req.url.split("/").pop();
    if (!id) throw new Error("Review ID is missing");

    const body = await req.json();
    const updates: any = {};

    // Existing fields
    if (body.status !== undefined) updates.status = body.status;
    if (body.isFeatured !== undefined) updates.isFeatured = body.isFeatured;
    
    // 🚀 NEW: Allow the full editor fields to pass through to the database!
    if (body.guestName !== undefined) updates.guestName = body.guestName;
    if (body.rating !== undefined) updates.rating = body.rating;
    if (body.content !== undefined) updates.content = body.content;
    if (body.productId !== undefined) updates.productId = body.productId;
    if (body.media !== undefined) updates.media = body.media;

    const { data, error } = await supabase.from("Review").update(updates).eq("id", id).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  try {
    // 🚀 FIX: Next.js version-agnostic ID extraction
    const id = req.url.split("/").pop();
    if (!id) throw new Error("Review ID is missing");

    const { error } = await supabase.from("Review").delete().eq("id", id);
    
    if (error) throw error;
    
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Deletion Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}