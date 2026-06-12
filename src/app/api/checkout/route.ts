import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Extract paymentMethod from the frontend request
    const { items, shippingAddress, couponCode, razorpayPaymentId, paymentMethod } = await req.json();

    // 2. Identify User or Auto-Create Guest Account
    const { data: { session } } = await supabase.auth.getSession();
    let userId = session?.user?.id;
    
    let generatedPassword: string | null = null; 

    if (!userId) {
      generatedPassword = Math.random().toString(36).slice(-12) + "Frx!9"; 
      
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: shippingAddress.email,
        password: generatedPassword,
        options: { data: { full_name: shippingAddress.fullName, phone_number: shippingAddress.phone } }
      });
      if (!signUpError && newUser?.user) userId = newUser.user.id;
    }

    if (userId) {
      // 1. Always ensure their Profile is up to date
      await supabase.from('Profile').upsert({
        id: userId, email: shippingAddress.email, fullName: shippingAddress.fullName, phone: shippingAddress.phone,
      });
      
      // 2. 🚀 FIXED: Check if they already have an address saved
      const { data: existingAddresses } = await supabase
        .from('Address')
        .select('id')
        .eq('userId', userId)
        .limit(1);

      // 3. Only save the address if this is their very first checkout!
      if (!existingAddresses || existingAddresses.length === 0) {
        await supabase.from('Address').insert([{
          userId: userId, label: 'Home', address: shippingAddress.address, city: shippingAddress.city,
          state: shippingAddress.state, pin: shippingAddress.pin, phone: shippingAddress.phone, isDefault: true
        }]);
      }
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

    // ====================================================================
    // SECURE MILESTONE ENGINE & FREE ITEM INJECTION
    // ====================================================================
    let milestoneDiscountAmount = 0;
    let emailMilestoneHtml = '';

    const { data: activeMilestone } = await supabase.from('MilestoneReward').select('*').eq('isActive', true).single();

    if (activeMilestone && serverSubtotal >= activeMilestone.thresholdAmount) {
      if (activeMilestone.rewardType === 'discount_percentage') {
        milestoneDiscountAmount = (serverSubtotal * parseFloat(activeMilestone.rewardValue)) / 100;
        emailMilestoneHtml = `<p style="color: #004de7; font-weight: bold; margin: 10px 0;">✨ Milestone Unlocked: ${activeMilestone.name} (-₹${milestoneDiscountAmount.toFixed(2)})</p>`;
      } else if (activeMilestone.rewardType === 'discount_fixed') {
        milestoneDiscountAmount = parseFloat(activeMilestone.rewardValue);
        emailMilestoneHtml = `<p style="color: #004de7; font-weight: bold; margin: 10px 0;">✨ Milestone Unlocked: ${activeMilestone.name} (-₹${milestoneDiscountAmount.toFixed(2)})</p>`;
      } else if (activeMilestone.rewardType === 'free_product') {
        const { data: freeProduct } = await supabase.from('Product').select('id, name, shortName').eq('id', activeMilestone.rewardValue).single();
        
        if (freeProduct) {
          secureOrderItems.push({
            productId: freeProduct.id,
            variantName: "FREE GIFT (Milestone Reward)",
            quantity: 1,
            price: 0
          });
          emailMilestoneHtml = `<p style="color: #004de7; font-weight: bold; margin: 10px 0;">🎁 FREE GIFT INCLUDED: ${freeProduct.shortName || freeProduct.name}</p>`;
        }
      }
    }

    const totalCombinedDiscount = serverDiscountAmount + milestoneDiscountAmount;
    const serverFinalAmount = Math.max(0, serverSubtotal - totalCombinedDiscount);

    // Generate Display ID
    const { count } = await supabase.from('Order').select('*', { count: 'exact', head: true });
    const orderNumber = (count || 0) + 1;
    const displayId = `FER-${orderNumber.toString().padStart(3, '0')}-26`;

    const isCOD = paymentMethod === "COD";
    const orderStatus = isCOD ? 'Processing' : 'Paid';

    // 5. Generate Order with VERIFIED Server Values
    const { data: order, error: orderError } = await supabase.from('Order').insert([{
      userId: userId || null, 
      displayId: displayId,
      totalAmount: serverSubtotal,
      discountAmount: totalCombinedDiscount, 
      couponCode: appliedDiscount,
      finalAmount: serverFinalAmount,
      shippingAddress: { ...shippingAddress, paymentId: razorpayPaymentId || (isCOD ? "COD_PENDING" : "FREE_ORDER") }, 
      status: orderStatus, 
      paymentMethod: paymentMethod || 'PREPAID' 
    }]).select().single();

    if (orderError) throw orderError;

    // 6. Insert Verified Order Items
    const finalOrderItems = secureOrderItems.map(item => ({ ...item, orderId: order.id }));
    const { error: itemsError } = await supabase.from('OrderItem').insert(finalOrderItems);
    if (itemsError) throw itemsError;

    // ====================================================================
    // 7. ENHANCED TRANSACTIONAL EMAILS VIA RESEND
    // ====================================================================
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Construct the Absolute URL for the Logo (Required for Emails)
        const baseUrl = req.headers.get('origin') || 'https://www.ferixo.com';
        const logoUrl = `https://www.ferixo.com/logo.svg`;

        // Reusable HTML block for comprehensive customer details
        const shippingDetailsHtml = `
          <p style="margin: 0 0 5px 0;"><strong>Name:</strong> ${shippingAddress.fullName}</p>
          <p style="margin: 0 0 5px 0;"><strong>Email:</strong> ${shippingAddress.email}</p>
          <p style="margin: 0 0 5px 0;"><strong>Phone:</strong> ${shippingAddress.phone}</p>
          <p style="margin: 0 0 5px 0;"><strong>Street Address:</strong> ${shippingAddress.address}</p>
          <p style="margin: 0 0 5px 0;"><strong>City:</strong> ${shippingAddress.city}</p>
          <p style="margin: 0 0 5px 0;"><strong>State:</strong> ${shippingAddress.state}</p>
          <p style="margin: 0 0 0 0;"><strong>PIN Code:</strong> ${shippingAddress.pin}</p>
        `;

        // --- CUSTOMER EMAIL TEMPLATE ---
        const customerEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #121212; line-height: 1.6;">
            <div style="text-align: left; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Ferixo" style="max-height: 60px; width: auto;" />
            </div>
            
            <h2 style="color: #004de7; margin-bottom: 5px;">Order Confirmed: ${displayId}</h2>
            <p style="font-size: 16px;">Hi ${shippingAddress.fullName},</p>
            <p style="font-size: 16px;">Thank you for your order! We are absolutely thrilled to have you shop with Ferixo. Your order has been successfully placed and is currently being processed by our fulfillment team. We will notify you via email as soon as it ships.</p>
            
            <div style="background: #f8f8f8; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #eaeaea;">
              <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Shipping Details</h3>
              ${shippingDetailsHtml}
            </div>
            
            <div style="background: #f8f8f8; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #eaeaea;">
              <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Order Summary</h3>
              ${emailMilestoneHtml}
              <p style="font-size: 18px; font-weight: bold; margin: 15px 0 5px 0;">Total Amount: ₹${serverFinalAmount.toFixed(2)}</p>
              <p style="margin: 0;"><strong>Payment Method:</strong> ${isCOD ? 'Cash on Delivery 🚚 (Please keep exact change ready)' : 'Prepaid (Paid Online) ✅'}</p>
            </div>

            ${typeof generatedPassword !== 'undefined' && generatedPassword ? `
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="color: #1d4ed8; margin-top: 0; margin-bottom: 10px;">We created an account for you!</h3>
              <p style="margin-top: 0;">You can use this account to easily track your order status.</p>
              <p style="margin: 0;"><strong>Email:</strong> ${shippingAddress.email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${generatedPassword}</p>
              <p style="font-size: 13px; color: #666;"><em>*Please log in and change your password as soon as possible.</em></p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 40px; color: #888; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Ferixo. All rights reserved.</p>
            </div>
          </div>
        `;

        // --- ADMIN EMAIL TEMPLATE ---
        const adminEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #121212; line-height: 1.6;">
            <div style="text-align: left; margin-bottom: 30px; margin-top: 20px;">
              <img src="${logoUrl}" alt="Ferixo" style="max-height: 60px; width: auto;" />
            </div>
            
            <h2 style="color: ${isCOD ? '#dc2626' : '#004de7'}; border-bottom: 2px solid ${isCOD ? '#dc2626' : '#004de7'}; padding-bottom: 10px;">
              ${isCOD ? '🚨 ACTION REQUIRED: COD ORDER' : '✅ NEW PREPAID ORDER'}
            </h2>
            
            <div style="background: #f8f8f8; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #eaeaea;">
              <h3 style="margin-top: 0; color: #333;">Order Information</h3>
              <p><strong>Order ID:</strong> ${displayId}</p>
              <p><strong>Total Amount:</strong> ₹${serverFinalAmount.toFixed(2)}</p>
              <p><strong>Payment Method:</strong> ${isCOD ? '<span style="color:red; font-weight:black; font-size: 16px;">CASH ON DELIVERY</span>' : '<span style="color:green; font-weight:bold;">Prepaid Online</span>'}</p>
              ${emailMilestoneHtml}
            </div>

            <div style="background: #f8f8f8; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #eaeaea;">
              <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Full Customer Details</h3>
              ${shippingDetailsHtml}
            </div>
          </div>
        `;

        // Send Email to Customer
        await resend.emails.send({
          from: 'Ferixo <info@ferixo.com>',
          to: shippingAddress.email,
          subject: `Order Confirmation - ${displayId}`,
          html: customerEmailHtml,
        });

        // Send Notification to Admin
        await resend.emails.send({
          from: 'Ferixo System <info@ferixo.com>',
          to: 'palashkhurana65@gmail.com',
          subject: isCOD ? `🚨 COD ORDER: ${displayId} (₹${serverFinalAmount.toFixed(2)})` : `✅ NEW ORDER: ${displayId} (₹${serverFinalAmount.toFixed(2)})`,
          html: adminEmailHtml,
        });

      } catch (emailError) {
        console.error("Resend Email Failed (but order succeeded):", emailError);
      }
    }

    return NextResponse.json({ success: true, orderId: order.id, displayId });
  } catch (error: any) {
    console.error("CHECKOUT CRASH:", error);
    return NextResponse.json({ error: error.message || "Checkout processing failed." }, { status: 500 });
  }
}