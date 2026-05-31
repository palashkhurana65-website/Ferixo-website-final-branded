import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, userId, rating, content, media } = body;

    if (!productId || !userId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("Review")
      .insert([
        {
          productId,
          userId,
          rating: Number(rating),
          content: content || "",
          media: media || [], // Accepts the uploaded media URLs
          status: "pending", 
          isFeatured: false, // Default to false
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: error.message || "Failed to submit review" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const admin = searchParams.get("admin");

    // Grab reviews AND the associated Product name for the admin dashboard
    let query = supabase
      .from("Review")
      .select("*, Product(name)")
      .order("created_at", { ascending: false });

    if (productId) query = query.eq("productId", productId);
    if (admin !== "true") query = query.eq("status", "approved");

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch reviews" }, { status: 500 });
  }
}