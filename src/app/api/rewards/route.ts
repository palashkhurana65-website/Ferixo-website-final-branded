import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 FIXED: Using the Service Role Key to bypass RLS for Admin Writes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { data: rewards, error } = await supabase
      .from('MilestoneReward')
      .select('*')
      .order('thresholdAmount', { ascending: true }); 

    if (error) throw error;
    return NextResponse.json(rewards || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate the input
    if (!body.name || !body.thresholdAmount || !body.rewardType || !body.rewardValue) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 2. Only allow one active reward at a time
    if (body.isActive) {
      await supabase.from('MilestoneReward').update({ isActive: false }).neq('id', '00000000-0000-0000-0000-000000000000'); 
    }

    // 3. Insert the new reward securely using the bypass key
    const { data, error } = await supabase.from('MilestoneReward').insert([{
      name: body.name,
      thresholdAmount: body.thresholdAmount,
      rewardType: body.rewardType,
      rewardValue: body.rewardValue,
      isActive: body.isActive || false
    }]).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, reward: data });
  } catch (error: any) {
    console.error("POST REWARD ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}