"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize Supabase with the Master Key (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAdminReviews() {
  // We use Supabase relational querying to fetch the associated Product Name
  const { data, error } = await supabaseAdmin
    .from("Review")
    .select(`
      id,
      rating,
      content,
      status,
      created_at,
      productId,
      Product ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch reviews");
  return data;
}

export async function updateReviewStatus(id: string, newStatus: 'approved' | 'rejected' | 'pending') {
  const { error } = await supabaseAdmin
    .from("Review")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) throw new Error("Failed to update status");
  
  revalidatePath("/admin/reviews");
  revalidatePath(`/products`); // Clears cache so the frontend updates instantly
  return { success: true };
}

export async function deleteReview(id: string) {
  const { error } = await supabaseAdmin
    .from("Review")
    .delete()
    .eq("id", id);

  if (error) throw new Error("Failed to delete review");
  
  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function adminCreateReview(productId: string, rating: number, content: string, customUserId: string) {
  // As the admin, you can bypass the frontend and inject reviews directly.
  // Note: customUserId must be a valid ID from your auth.users table.
  const { error } = await supabaseAdmin
    .from("Review")
    .insert([
      {
        productId: productId,
        userId: customUserId, 
        rating: rating,
        content: content,
        status: 'approved' // Auto-approve admin-created reviews
      }
    ]);

  if (error) throw new Error(`Database Error: ${error.message}`);
  
  revalidatePath("/admin/reviews");
  return { success: true };
}