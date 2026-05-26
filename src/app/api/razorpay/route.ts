import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Razorpay strictly requires amounts in the smallest currency unit (paise)
    const options = {
      amount: Math.round(amount * 100), 
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ 
      id: order.id, 
      currency: order.currency, 
      amount: order.amount 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate Razorpay order" }, { status: 500 });
  }
}