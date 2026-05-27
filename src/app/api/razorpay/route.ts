import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "../../../lib/supabase/server";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Instead of trusting { amount: 100 }, we demand the cart contents
    const { items, couponCode } = await req.json();

    // 1. Fetch real prices from database
    const productIds = items.map((item: any) => item.productId);
    const { data: dbProducts } = await supabase.from('Product').select('id, basePrice, Variant(capacity, colorName, price)').in('id', productIds);

    let serverSubtotal = 0;
    for (const item of items) {
      const dbProduct = dbProducts?.find((p) => p.id === item.productId);
      let actualPrice = dbProduct?.basePrice || 0;

      if (item.variantName && item.variantName !== "Standard Size" && dbProduct?.Variant) {
        const [cap, col] = item.variantName.split(" - ");
        const dbVariant = dbProduct.Variant.find((v: any) => v.capacity === cap && v.colorName === col);
        if (dbVariant && dbVariant.price !== null) actualPrice = dbVariant.price;
      }
      serverSubtotal += actualPrice * item.quantity;
    }

    // 2. Validate Coupon
    let serverDiscountAmount = 0;
    if (couponCode) {
      const { data: coupon } = await supabase.from('Coupon').select('*').eq('code', couponCode).eq('isActive', true).single();
      if (coupon) {
        serverDiscountAmount = (serverSubtotal * coupon.discount) / 100;
      }
    }

    const serverFinalAmount = serverSubtotal - serverDiscountAmount;

    // 3. Generate Razorpay Order securely (Amount is in Paise, so multiply by 100)
    const options = {
      amount: Math.round(serverFinalAmount * 100), 
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}