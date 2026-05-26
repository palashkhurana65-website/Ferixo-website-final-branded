"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import { Package, ShoppingBag, TrendingUp, Search, Eye, Tag } from "lucide-react";
import Link from "next/link";

export default function OrdersAdminPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Metrics State
  const [globalStock, setGlobalStock] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [couponLeaderboard, setCouponLeaderboard] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // 1. Fetch Orders with nested Items
    const { data: ordersData } = await supabase
      .from('Order')
      .select('*, OrderItem(*)')
      .order('createdAt', { ascending: false });

    // 2. Fetch Total Global Stock
    const { data: products } = await supabase.from('Product').select('stock');
    const stockCount = products?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0;

    if (ordersData) {
      setOrders(ordersData);
      setGlobalStock(stockCount);
      setTotalRevenue(ordersData.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + (o.finalAmount || 0), 0));
      setActiveOrders(ordersData.filter(o => o.status === 'Pending' || o.status === 'Preparing for dispatch').length);

      // 3. Aggregate Coupon Usage
      const counts: Record<string, number> = {};
      ordersData.forEach(o => {
        if (o.couponCode) {
          counts[o.couponCode] = (counts[o.couponCode] || 0) + 1;
        }
      });
      setCouponLeaderboard(counts);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Optimistic UI Update for instant feedback
    setOrders(currentOrders => currentOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Background Database Update
    const { error } = await supabase
      .from('Order')
      .update({ status: newStatus })
      .eq('id', orderId);
      
    if (error) {
      console.error("Failed to update status:", error);
      fetchDashboardData(); // Revert on failure
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Loading Order Logistics...</div>;

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-20">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Orders & Fulfillment</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Manage logistics, track inventory, and push status updates.</p>
      </div>

      {/* METRICS DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue"><ShoppingBag size={24}/></div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Active Orders</p>
            <h3 className="text-2xl font-black text-primary">{activeOrders}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500"><TrendingUp size={24}/></div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Gross Revenue</p>
            <h3 className="text-2xl font-black text-primary">₹{totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-brand-orange"><Package size={24}/></div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Global Stock</p>
            <h3 className="text-2xl font-black text-primary">{globalStock} Units</h3>
          </div>
        </div>

        {/* COUPON LEADERBOARD */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2 flex items-center gap-2"><Tag size={14}/> Top Coupons Used</p>
          {Object.keys(couponLeaderboard).length > 0 ? (
            <div className="space-y-1">
              {Object.entries(couponLeaderboard).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([code, count]) => (
                <div key={code} className="flex justify-between items-center text-sm">
                  <span className="font-bold text-brand-blue">{code}</span>
                  <span className="font-medium text-gray-500">{count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-bold text-gray-300">No coupons recorded yet.</p>
          )}
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary">Transaction Ledger</h2>
        </div>

        {orders.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => {
              const address = order.shippingAddress as any;
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div key={order.id} className="p-6 flex flex-col xl:flex-row gap-6 hover:bg-gray-50/30 transition-colors">
                  
                  {/* Column 1: Identity & Logistics */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-black font-mono text-brand-blue tracking-tight">{order.displayId || "FER-OLD-ORDER"}</span>
                        <span className="text-xs text-gray-400 font-bold">{formattedDate}</span>
                      </div>
                      <p className="text-lg font-black text-primary">{address?.fullName || "Guest User"}</p>
                      <p className="text-sm text-gray-500 font-medium leading-snug max-w-sm mt-1">
                        {address?.address}<br/>
                        {address?.city}, {address?.state} - {address?.pin}<br/>
                        Phone: {address?.phone || "N/A"}
                      </p>
                    </div>

                    {/* Interactive Status Pipeline */}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {['Preparing for dispatch', 'Shipped', 'Delivered'].map(status => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status)}
                            className={`text-[10px] md:text-xs uppercase font-bold tracking-wider px-3 md:px-4 py-2 rounded-xl transition-all ${
                              order.status === status || (order.status === 'Pending' && status === 'Preparing for dispatch')
                                ? status === 'Delivered' ? 'bg-green-500 text-white shadow-md'
                                : status === 'Shipped' ? 'bg-brand-blue text-white shadow-md'
                                : 'bg-brand-orange text-white shadow-md'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                            }`}
                          >
                            {status === 'Preparing for dispatch' ? 'Preparing' : status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Items & Financials */}
                  <div className="flex-1 bg-canvas p-5 rounded-2xl border border-gray-100 flex flex-col justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Items Ordered</p>
                      <div className="space-y-2 mb-4">
                        {order.OrderItem?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-start text-sm">
                            <span className="font-bold text-primary">{item.quantity}x {item.variantName}</span>
                            <span className="font-medium text-gray-500">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      {order.couponCode && (
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="font-bold text-gray-400">Coupon Used:</span>
                          <span className="font-black text-brand-blue bg-blue-50 px-2 py-0.5 rounded">{order.couponCode}</span>
                        </div>
                      )}
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="font-bold text-gray-400">Discount:</span>
                          <span className="font-bold text-green-500">-₹{order.discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-black text-primary uppercase tracking-wider text-xs">Total Paid</span>
                        <span className="text-xl font-black text-primary">₹{(order.finalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Search size={40} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-primary">No Orders Yet</h3>
            <p className="text-gray-500 text-sm mt-2">When customers make purchases, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}