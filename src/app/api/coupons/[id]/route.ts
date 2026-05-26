import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  await supabase.from('Coupon').delete().eq('id', id);
  return NextResponse.json({ success: true });
}