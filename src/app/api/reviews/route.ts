import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GUARANTEES data is fetched fresh every single time. Kills the cache bug.
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, userId, guestName, rating, content, media } = body;

    if (!productId || !rating || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("Review")
      .insert([{
          productId,
          userId: userId || null,
          guestName: guestName || "Verified Customer",
          rating: Number(rating),
          content,
          media: media || [],
          status: "approved", // Instantly live
          isFeatured: false, 
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const admin = searchParams.get("admin");

    let query = supabase
      .from("Review")
      .select("*, Product(name, shortName), Profile(fullName)")
      .order("created_at", { ascending: false });

    if (productId) query = query.eq("productId", productId);
    if (admin !== "true") query = query.eq("status", "approved");

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}