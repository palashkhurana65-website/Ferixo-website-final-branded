import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 FIXED: Using the Service Role Key to bypass RLS for Admin Writes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(req: Request) {
  try {
    const id = req.url.split("/").pop();
    if (!id) throw new Error("Reward ID is missing");
    
    const body = await req.json();

    // If activating this reward, deactivate all others first to prevent conflicts
    if (body.isActive === true) {
        await supabase.from('MilestoneReward').update({ isActive: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { error } = await supabase.from('MilestoneReward').update({ isActive: body.isActive }).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = req.url.split("/").pop();
    if (!id) throw new Error("Reward ID is missing");

    const { error } = await supabase.from('MilestoneReward').delete().eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}