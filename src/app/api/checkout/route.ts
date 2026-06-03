import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. 🚀 NEW: Extract paymentMethod from the frontend request
    const { items, shippingAddress, couponCode, razorpayPaymentId, paymentMethod } = await req.json();

    // 2. Identify User or Auto-Create Guest Account
    const { data: { session } } = await supabase.auth.getSession();
    let userId = session?.user?.id;

    if (!userId) {
      const generatedPassword = Math.random().toString(36).slice(-12) + "Frx!9";
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: shippingAddress.email,
        password: generatedPassword,
        options: { data: { full_name: shippingAddress.fullName, phone_number: shippingAddress.phone } }
      });
      if (!signUpError && newUser?.user) userId = newUser.user.id;
    }

    if (userId) {
      await supabase.from('Profile').upsert({
        id: userId, email: shippingAddress.email, fullName: shippingAddress.fullName, phone: shippingAddress.phone,
      });
      await supabase.from('Address').insert([{
        userId: userId, label: 'Home', address: shippingAddress.address, city: shippingAddress.city,
        state: shippingAddress.state, pin: shippingAddress.pin, phone: shippingAddress.phone, isDefault: true
      }]);
    }

    // ====================================================================
    // SECURITY PHASE 2: SERVER-SIDE PRICE CALCULATION
    // ====================================================================
    const productIds = items.map((item: any) => item.productId);
    const { data: dbProducts, error: productError } = await supabase
      .from('Product')
      .select('id, basePrice, Variant(capacity, colorName, price)')
      .in('id', productIds);

    if (productError || !dbProducts) throw new Error("Failed to verify product prices.");

    let serverSubtotal = 0;
    const secureOrderItems = [];

    for (const item of items) {
      const dbProduct = dbProducts.find((p) => p.id === item.productId);
      if (!dbProduct) throw new Error(`Product not found: ${item.productId}`);

      let actualPrice = dbProduct.basePrice;

      if (item.variantName && item.variantName !== "Standard Size" && dbProduct.Variant && dbProduct.Variant.length > 0) {
        const [cap, col] = item.variantName.split(" - ");
        const dbVariant = dbProduct.Variant.find((v: any) => v.capacity === cap && v.colorName === col);
        if (dbVariant && dbVariant.price !== null) {
          actualPrice = dbVariant.price;
        }
      }

      serverSubtotal += actualPrice * item.quantity;
      
      secureOrderItems.push({
        productId: item.productId,
        variantName: item.variantName,
        quantity: item.quantity,
        price: actualPrice 
      });
    }

    // ====================================================================
    // SECURE PROMO CODE VALIDATION
    // ====================================================================
    let serverDiscountAmount = 0;
    let appliedDiscount = null;

    if (couponCode) {
      const { data: coupon } = await supabase.from('Coupon').select('*').eq('code', couponCode).eq('isActive', true).single();
      if (coupon) {
        appliedDiscount = coupon.code;
        serverDiscountAmount = (serverSubtotal * coupon.discount) / 100;
        
        const { data: existingUsage } = await supabase.from('CouponUsage').select('id, usageCount').eq('email', shippingAddress.email).eq('couponCode', couponCode).single();
        if (existingUsage) {
          await supabase.from('CouponUsage').update({ usageCount: existingUsage.usageCount + 1, lastUsedAt: new Date().toISOString() }).eq('id', existingUsage.id);
        } else {
          await supabase.from('CouponUsage').insert([{ email: shippingAddress.email, couponCode: couponCode, usageCount: 1, userId: userId || null }]);
        }
      } else {
        return NextResponse.json({ error: "Invalid or expired promo code." }, { status: 400 });
      }
    }

    const serverFinalAmount = serverSubtotal - serverDiscountAmount;

    // Generate Display ID
    const { count } = await supabase.from('Order').select('*', { count: 'exact', head: true });
    const orderNumber = (count || 0) + 1;
    const displayId = `FER-${orderNumber.toString().padStart(3, '0')}-26`;

    // 🚀 NEW: Determine Order Status dynamically based on Payment Method
    const isCOD = paymentMethod === "COD";
    const orderStatus = isCOD ? 'Processing' : 'Paid';

    // 5. Generate Order with VERIFIED Server Values
    const { data: order, error: orderError } = await supabase.from('Order').insert([{
      userId: userId || null, 
      displayId: displayId,
      totalAmount: serverSubtotal,
      discountAmount: serverDiscountAmount,
      couponCode: appliedDiscount,
      finalAmount: serverFinalAmount,
      shippingAddress: { ...shippingAddress, paymentId: razorpayPaymentId || (isCOD ? "COD_PENDING" : "FREE_ORDER") }, 
      status: orderStatus, // Assigns 'Processing' for COD, 'Paid' for Prepaid
      paymentMethod: paymentMethod || 'PREPAID' // Saves the method securely to the column
    }]).select().single();

    if (orderError) throw orderError;

    // 6. Insert Verified Order Items
    const finalOrderItems = secureOrderItems.map(item => ({ ...item, orderId: order.id }));
    const { error: itemsError } = await supabase.from('OrderItem').insert(finalOrderItems);
    if (itemsError) throw itemsError;

    // 7. 🚀 NEW: Dynamic Transactional Emails via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const emailHtml = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #121212;">
          <h2 style="color: #004de7;">Order Confirmed: ${displayId}</h2>
          <p>Hi ${shippingAddress.fullName},</p>
          <p>Thank you for shopping with Ferixo. Your order is currently being processed.</p>
          <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Shipping Details:</h3>
            <p>${shippingAddress.address}<br/>${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pin}</p>
            <h3>Order Total: ₹${serverFinalAmount.toFixed(2)}</h3>
            <p><strong>Payment Method:</strong> ${isCOD ? 'Cash on Delivery 🚚 (Please keep exact change ready at delivery)' : 'Prepaid (Paid Online) ✅'}</p>
          </div>
        </div>
      `;

      // Email to Customer
      await resend.emails.send({
        from: 'Ferixo <info@ferixo.com>',
        to: shippingAddress.email,
        subject: `Order Confirmation - ${displayId}`,
        html: emailHtml,
      });

      // Notification to Admin
      await resend.emails.send({
        from: 'Ferixo System <info@ferixo.com>',
        to: 'palashkhurana65@gmail.com',
        subject: isCOD ? `🚨 NEW COD ORDER: ${displayId} (Collect Cash)` : `NEW ORDER ALERT: ${displayId}`,
        html: `<h2>New Order Received!</h2>
          <p><strong>Order ID:</strong> ${displayId}</p>
          <p><strong>Customer:</strong> ${shippingAddress.fullName} (${shippingAddress.phone})</p>
          <p><strong>Total:</strong> ₹${serverFinalAmount.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${isCOD ? '<span style="color:red; font-weight:bold; font-size:18px;">CASH ON DELIVERY - COLLECT CASH</span>' : 'Prepaid Online'}</p>`,
      });
    }

    return NextResponse.json({ success: true, orderId: order.id, displayId });
  } catch (error: any) {
    console.error("CHECKOUT CRASH:", error);
    return NextResponse.json({ error: error.message || "Checkout processing failed." }, { status: 500 });
  }
}