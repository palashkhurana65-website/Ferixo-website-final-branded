"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, MapPin, Package, Clock, Truck, CheckCircle2, LogOut, ShoppingBag, Edit2, Trash2, Plus, X, Save } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  // Editing States
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [identityForm, setIdentityForm] = useState({ fullName: "", phone: "" });
  
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ id: "", label: "Home", address: "", city: "", pin: "" });

  useEffect(() => {
    const fetchAccountData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      // Fetch Profile
      const { data: profileData } = await supabase.from('Profile').select('*').eq('id', session.user.id).single();
      setProfile(profileData);
      setIdentityForm({ fullName: profileData?.fullName || "", phone: profileData?.phone || "" });

      // Fetch Addresses
      const { data: addressData } = await supabase.from('Address').select('*').eq('userId', session.user.id).order('createdAt', { ascending: true });
      setAddresses(addressData || []);

      // Fetch Orders
      const { data: orderData } = await supabase.from('Order').select('*, OrderItem(*)').eq('userId', session.user.id).order('createdAt', { ascending: false });
      setOrders(orderData || []);
      
      setLoading(false);
    };
    fetchAccountData();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // --- SAVE HANDLERS ---
  const handleSaveIdentity = async () => {
    const { error } = await supabase.from('Profile').update({ fullName: identityForm.fullName, phone: identityForm.phone }).eq('id', user.id);
    if (!error) {
      setProfile({ ...profile, ...identityForm });
      setIsEditingIdentity(false);
    }
  };

  const handleSaveAddress = async () => {
    const payload = { userId: user.id, label: addressForm.label, address: addressForm.address, city: addressForm.city, pin: addressForm.pin };
    
    if (addressForm.id) {
      // Update existing
      const { error } = await supabase.from('Address').update(payload).eq('id', addressForm.id);
      if (!error) {
        setAddresses(addresses.map(a => a.id === addressForm.id ? { ...a, ...payload } : a));
        setShowAddressForm(false);
      }
    } else {
      // Insert new
      const { data, error } = await supabase.from('Address').insert([payload]).select().single();
      if (data && !error) {
        setAddresses([...addresses, data]);
        setShowAddressForm(false);
      }
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase.from('Address').delete().eq('id', id);
    if (!error) setAddresses(addresses.filter(a => a.id !== id));
  };

  const openNewAddressForm = () => {
    setAddressForm({ id: "", label: "Home", address: "", city: "", pin: "" });
    setShowAddressForm(true);
  };

  // UI Helper for Order Pipeline
  const getStatusUI = (status: string) => {
    if (status === 'Pending' || status === 'Preparing for dispatch') return { label: 'Preparing for dispatch', step: 1, color: 'text-brand-orange', bg: 'bg-orange-50', icon: Clock };
    if (status === 'Shipped') return { label: 'Shipped', step: 2, color: 'text-brand-blue', bg: 'bg-blue-50', icon: Truck };
    if (status === 'Delivered') return { label: 'Delivered', step: 3, color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle2 };
    return { label: status, step: 0, color: 'text-gray-500', bg: 'bg-gray-100', icon: Package };
  };

  if (!loading && !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-blue-50 text-brand-blue rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <User size={36} />
        </div>
        <h1 className="text-3xl font-black text-primary tracking-tight mb-3">Sign In Required</h1>
        <p className="text-gray-500 font-medium mb-8 max-w-sm">
          Please log in to your Ferixo account to view your dashboard, track orders, and manage addresses.
        </p>
        
        <div className="flex flex-col items-center gap-5 w-full max-w-xs">
          <Link href="/login" className="w-full bg-brand-blue text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-brand-blue/20 hover:bg-blue-700 transition-all active:scale-95 text-center">
            Sign In
          </Link>
          <p className="text-sm font-medium text-gray-500">
            Don't have an account? <Link href="/register" className="text-brand-blue font-bold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Secure Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 pb-32">
      
      {/* DYNAMIC HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-brand-blue text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-blue/20">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tighter">
              {profile?.fullName ? `Hi, ${profile.fullName.split(' ')[0]}` : "My Account"}
            </h1>
            <p className="text-sm font-bold text-gray-400 mt-1">{user.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand-orange transition-colors bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        
        {/* LEFT COLUMN: IDENTITY & ADDRESSES */}
        <div className="space-y-8">
          
          {/* IDENTITY CARD */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-primary flex items-center gap-2"><User size={20} className="text-brand-blue"/> Identity</h2>
              {!isEditingIdentity && (
                <button onClick={() => setIsEditingIdentity(true)} className="text-brand-blue hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 size={16}/></button>
              )}
            </div>
            
            {isEditingIdentity ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Full Name</label>
                  <input type="text" value={identityForm.fullName} onChange={(e) => setIdentityForm({...identityForm, fullName: e.target.value})} className="w-full bg-canvas border border-gray-200 rounded-xl p-3 outline-none focus:border-brand-blue text-primary font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                  <input type="text" value={identityForm.phone} onChange={(e) => setIdentityForm({...identityForm, phone: e.target.value})} className="w-full bg-canvas border border-gray-200 rounded-xl p-3 outline-none focus:border-brand-blue text-primary font-bold" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsEditingIdentity(false)} className="flex-1 bg-canvas text-gray-500 font-bold py-3 rounded-xl hover:text-primary">Cancel</button>
                  <button onClick={handleSaveIdentity} className="flex-1 bg-brand-blue text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-blue-700"><Save size={16}/> Save</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Full Name</p>
                  <p className="text-primary font-bold">{profile?.fullName || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Phone Number</p>
                  <p className="text-primary font-bold">{profile?.phone || "Not provided"}</p>
                </div>
              </div>
            )}
          </div>

          {/* ADDRESS BOOK */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-primary flex items-center gap-2"><MapPin size={20} className="text-brand-blue"/> Address Book</h2>
              {!showAddressForm && (
                <button onClick={openNewAddressForm} className="text-brand-blue hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition-colors"><Plus size={16}/></button>
              )}
            </div>

            {showAddressForm ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-primary">{addressForm.id ? "Edit Address" : "New Address"}</h3>
                  <button onClick={() => setShowAddressForm(false)} className="text-gray-400 hover:text-brand-orange"><X size={18}/></button>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Label</label>
                  <select value={addressForm.label} onChange={(e) => setAddressForm({...addressForm, label: e.target.value})} className="w-full bg-canvas border border-gray-200 rounded-xl p-3 outline-none focus:border-brand-blue text-primary font-bold cursor-pointer">
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Full Address</label>
                  <textarea rows={3} value={addressForm.address} onChange={(e) => setAddressForm({...addressForm, address: e.target.value})} className="w-full bg-canvas border border-gray-200 rounded-xl p-3 outline-none focus:border-brand-blue text-primary font-medium resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">City</label>
                    <input type="text" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} className="w-full bg-canvas border border-gray-200 rounded-xl p-3 outline-none focus:border-brand-blue text-primary font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">PIN Code</label>
                    <input type="text" value={addressForm.pin} onChange={(e) => setAddressForm({...addressForm, pin: e.target.value})} className="w-full bg-canvas border border-gray-200 rounded-xl p-3 outline-none focus:border-brand-blue text-primary font-bold" />
                  </div>
                </div>
                <button onClick={handleSaveAddress} className="w-full mt-2 bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-700">Save Address</button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.length === 0 ? (
                   <p className="text-gray-400 font-medium text-sm">No saved addresses.</p>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className="p-4 bg-canvas border border-gray-200 rounded-2xl flex flex-col gap-2 relative group transition-colors hover:border-brand-blue">
                      <div className="flex justify-between items-start">
                        <span className="bg-white border border-gray-200 text-brand-blue text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                          {addr.label}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setAddressForm(addr); setShowAddressForm(true); }} className="text-gray-400 hover:text-brand-blue"><Edit2 size={16}/></button>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="text-gray-400 hover:text-brand-orange"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      <div className="text-primary font-medium text-sm leading-snug pr-8">
                        {addr.address}<br/>{addr.city}, {addr.pin}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
        </div>

        {/* RIGHT COLUMN: ORDER TRACKING ENGINE (Remains visually untouched but updated) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-primary flex items-center gap-3 mb-2">
            <Package size={24} className="text-brand-blue" /> Order History
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6"><ShoppingBag size={32}/></div>
              <h3 className="text-xl font-black text-primary mb-2">No orders yet</h3>
              <p className="text-gray-500 font-medium mb-8">When you invest in premium Ferixo gear, your tracking details will appear here.</p>
              <Link href="/shop/all" className="bg-brand-blue text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-brand-blue/20 hover:bg-blue-700 transition-all active:scale-95">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const ui = getStatusUI(order.status);
                const StatusIcon = ui.icon;
                
                return (
                  <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    
                    {/* Order Header */}
                    <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Order ID</p>
                        <p className="text-lg font-black text-brand-blue font-mono tracking-tight">{order.displayId || "FER-OLD-ORDER"}</p>
                        <p className="text-xs text-gray-500 font-bold mt-2">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Total Amount</p>
                        <p className="text-2xl font-black text-primary">₹{(order.finalAmount || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Order Pipeline */}
                    <div className="p-6 md:p-8 border-b border-gray-100">
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ui.bg} ${ui.color}`}>
                          <StatusIcon size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-0.5">Current Status</p>
                          <p className={`text-xl font-black ${ui.color}`}>{ui.label}</p>
                        </div>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${ui.step === 1 ? 'w-1/3 bg-brand-orange' : ui.step === 2 ? 'w-2/3 bg-brand-blue' : ui.step === 3 ? 'w-full bg-green-500' : 'w-0'}`}></div>
                      </div>
                      <div className="flex justify-between mt-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                         <span className={ui.step >= 1 ? 'text-primary' : ''}>Preparing</span>
                         <span className={ui.step >= 2 ? 'text-primary' : ''}>Shipped</span>
                         <span className={ui.step >= 3 ? 'text-primary' : ''}>Delivered</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6 md:p-8">
                      <h4 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">Items in this shipment</h4>
                      <div className="space-y-4">
                        {order.OrderItem?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-4 bg-canvas p-3 rounded-2xl border border-gray-200 hover:border-brand-blue transition-colors">
                             <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-brand-blue border border-gray-100 flex-shrink-0">
                               x{item.quantity}
                             </div>
                             <div className="flex-1">
                               <p className="text-sm font-bold text-primary truncate">Product ID Linked</p>
                               <p className="text-xs font-bold text-gray-500 mt-0.5">{item.variantName}</p>
                             </div>
                             <p className="text-sm font-black text-primary">₹{item.priceAtPurchase || item.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}