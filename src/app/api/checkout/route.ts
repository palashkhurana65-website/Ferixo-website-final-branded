import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { items, shippingAddress, couponCode, totalAmount, finalAmount } = await req.json();

    // 1. Identify User or Auto-Create Guest Account
    const { data: { session } } = await supabase.auth.getSession();
    let userId = session?.user?.id;

    if (!userId) {
      // GUEST MODE: Attempt to create an account seamlessly
      const generatedPassword = Math.random().toString(36).slice(-12) + "Frx!9"; // Secure random password
      
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: shippingAddress.email,
        password: generatedPassword,
        options: {
          data: { full_name: shippingAddress.fullName, phone_number: shippingAddress.phone }
        }
      });

      if (!signUpError && newUser?.user) {
        userId = newUser.user.id;
      }
    }

    // 2. Save/Update the User's Profile & Dedicated Address Table
    if (userId) {
      // Update basic identity
      await supabase.from('Profile').upsert({
        id: userId,
        email: shippingAddress.email,
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
      });

      // Insert into the new multi-address table
      await supabase.from('Address').insert([{
        userId: userId,
        label: 'Home',
        address: shippingAddress.address,
        city: shippingAddress.city,
        pin: shippingAddress.pin,
        isDefault: true
      }]);
    }

    // 3. Validate Promo Code & Update Ledger
    let appliedDiscount = null;
    let calculatedDiscountAmount = totalAmount - finalAmount;

    if (couponCode) {
      const { data: coupon } = await supabase
        .from('Coupon')
        .select('*')
        .eq('code', couponCode)
        .eq('isActive', true)
        .single();
        
      if (coupon) {
        appliedDiscount = coupon.code;
        
        // Update the CouponUsage Ledger by Email (works for both guests and users)
        const { data: existingUsage } = await supabase
          .from('CouponUsage')
          .select('id, usageCount')
          .eq('email', shippingAddress.email)
          .eq('couponCode', couponCode)
          .single();
          
        if (existingUsage) {
          await supabase.from('CouponUsage').update({ 
            usageCount: existingUsage.usageCount + 1, 
            lastUsedAt: new Date().toISOString() 
          }).eq('id', existingUsage.id);
        } else {
          await supabase.from('CouponUsage').insert([{ 
            email: shippingAddress.email, 
            couponCode: couponCode, 
            usageCount: 1, 
            userId: userId || null 
          }]);
        }
      } else {
        return NextResponse.json({ error: "Invalid or expired promo code." }, { status: 400 });
      }
    }

    // 4. Generate Custom Order ID (FER-001-26)
    const { count } = await supabase.from('Order').select('*', { count: 'exact', head: true });
    const orderNumber = (count || 0) + 1;
    const displayId = `FER-${orderNumber.toString().padStart(3, '0')}-26`;

    // 5. Generate the Order Row (Using Correct Column Names)
    const { data: order, error: orderError } = await supabase.from('Order').insert([{
      userId: userId || null, 
      displayId: displayId,
      totalAmount: totalAmount,
      discountAmount: calculatedDiscountAmount > 0 ? calculatedDiscountAmount : 0,
      couponCode: appliedDiscount, // Updated column name
      finalAmount: finalAmount,
      shippingAddress: shippingAddress, 
      status: 'Pending'
    }]).select().single();

    if (orderError) throw orderError;

    // 6. Insert Order Items
    const orderItems = items.map((item: any) => ({
      orderId: order.id,
      productId: item.productId,
      variantName: item.variantName,
      quantity: item.quantity,
      price: item.price // FIXED: Changed from priceAtPurchase to price to match database
    }));

    const { error: itemsError } = await supabase.from('OrderItem').insert(orderItems);
    if (itemsError) throw itemsError;

    // 7. Dispatch Transactional Emails via Resend
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
            <h3>Order Total: ₹${finalAmount.toFixed(2)}</h3>
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
        subject: `NEW ORDER ALERT: ${displayId}`,
        html: `<h2>New Order Received!</h2><p><strong>Order ID:</strong> ${displayId}</p><p><strong>Customer:</strong> ${shippingAddress.fullName} (${shippingAddress.phone})</p><p><strong>Total:</strong> ₹${finalAmount.toFixed(2)}</p>`,
      });
    }

    return NextResponse.json({ success: true, orderId: order.id, displayId });
  } catch (error: any) {
    console.error("CHECKOUT CRASH:", error);
    return NextResponse.json({ error: error.message || "Checkout processing failed." }, { status: 500 });
  }
}