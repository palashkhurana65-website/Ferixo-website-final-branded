"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../lib/supabase/client";
import { Ticket, Plus, Trash2, Percent, Calendar, ShieldCheck, Users, AlertCircle, Edit2, Save, X } from "lucide-react";

type Coupon = { 
  id: string; 
  code: string; 
  discount: number; 
  isActive: boolean; 
  startDate: string | null;
  endDate: string | null;
  isFirstTimeOnly: boolean;
  maxUsesPerUser: number | null;
  createdAt: string; 
};

export default function CouponManager() {
  const supabase = createClient();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced Coupon State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFirstTimeOnly, setIsFirstTimeOnly] = useState(false);
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Coupon')
      .select('*')
      .order('createdAt', { ascending: false });
      
    if (data) setCoupons(data);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  // Populates the form with existing data when Edit is clicked
  const handleEditClick = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setCode(coupon.code);
    setDiscount(coupon.discount.toString());
    
    // HTML datetime-local inputs require the format YYYY-MM-DDThh:mm
    setStartDate(coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : "");
    setEndDate(coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : "");
    
    setIsFirstTimeOnly(coupon.isFirstTimeOnly);
    setMaxUsesPerUser(coupon.maxUsesPerUser ? coupon.maxUsesPerUser.toString() : "");
    
    // Scroll smoothly to the top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCode(""); setDiscount(""); setStartDate(""); setEndDate(""); 
    setIsFirstTimeOnly(false); setMaxUsesPerUser("");
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!code || !discount) {
      setError("Code and Discount are required.");
      return;
    }
    
    const payload = {
      code: code.toUpperCase().trim(),
      discount: parseInt(discount),
      isActive: true,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      isFirstTimeOnly: isFirstTimeOnly,
      maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : null
    };

    if (editingId) {
      // UPDATE EXISTING
      const { error: updateError } = await supabase.from('Coupon').update(payload).eq('id', editingId);
      if (updateError) {
        console.error("Coupon Update Error:", updateError);
        setError(`Database Error: ${updateError.message}`);
        return;
      }
    } else {
      // INSERT NEW
      const { error: insertError } = await supabase.from('Coupon').insert([payload]);
      if (insertError) {
        console.error("Coupon Insert Error:", insertError);
        setError(`Database Error: ${insertError.message}`);
        return;
      }
    }

    cancelEdit();
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this coupon? This cannot be undone.")) {
      await supabase.from('Coupon').delete().eq('id', id);
      fetchCoupons();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
         <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
              <div className="p-3 bg-brand-blue/10 rounded-2xl"><Ticket className="text-brand-blue" size={28} /></div>
              Promo Engine
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-2">Manage discounts, set usage limits, and run time-sensitive campaigns.</p>
         </div>
      </div>

      {error && (
        <div className="bg-orange-50 border border-brand-orange text-brand-orange p-4 rounded-2xl font-bold flex items-center gap-3">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* ========================================== */}
        {/* CREATE / EDIT FORM */}
        {/* ========================================== */}
        <div className="lg:col-span-1">
           <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5 sticky top-24">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h2 className="font-bold text-primary text-lg">
                  {editingId ? "Edit Campaign" : "New Campaign"}
                </h2>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-brand-orange">
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className="block text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Code</label>
                   <input type="text" placeholder="e.g. SUMMER20" required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary font-mono outline-none focus:border-brand-blue uppercase font-bold" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <div className="col-span-2">
                   <label className="block text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Discount %</label>
                   <div className="relative">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="number" required min="1" max="100" className="w-full bg-canvas border border-gray-200 rounded-xl p-4 pl-12 text-primary font-mono outline-none focus:border-brand-blue font-bold" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div className="col-span-2">
                  <h3 className="text-xs uppercase tracking-widest text-brand-blue font-bold mb-3 flex items-center gap-2"><Calendar size={14}/> Active Window</h3>
                </div>
                <div>
                   <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Start Date</label>
                   <input type="datetime-local" className="w-full bg-canvas border border-gray-200 rounded-xl p-3 text-sm text-primary outline-none focus:border-brand-blue" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                   <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">End Date</label>
                   <input type="datetime-local" className="w-full bg-canvas border border-gray-200 rounded-xl p-3 text-sm text-primary outline-none focus:border-brand-blue" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs uppercase tracking-widest text-brand-blue font-bold flex items-center gap-2"><ShieldCheck size={14}/> Usage Limits</h3>
                
                <label className="flex items-center gap-3 p-3 bg-canvas border border-gray-200 rounded-xl cursor-pointer hover:border-brand-blue transition-colors">
                  <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" checked={isFirstTimeOnly} onChange={(e) => setIsFirstTimeOnly(e.target.checked)} />
                  <span className="text-sm font-bold text-primary">First-Time Buyers Only</span>
                </label>

                <div>
                   <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Max Uses Per Customer</label>
                   <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="number" placeholder="Leave blank for unlimited" min="1" className="w-full bg-canvas border border-gray-200 rounded-xl p-3 pl-11 text-sm text-primary outline-none focus:border-brand-blue font-bold" value={maxUsesPerUser} onChange={(e) => setMaxUsesPerUser(e.target.value)} />
                   </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="flex-1 bg-canvas text-gray-500 font-bold py-4 rounded-xl hover:text-primary transition-colors">
                    Cancel
                  </button>
                )}
                <button type="submit" className={`flex-1 ${editingId ? 'bg-green-500 hover:bg-green-600' : 'bg-brand-blue hover:bg-blue-700'} text-white p-4 rounded-xl font-black transition-all flex justify-center items-center gap-2 shadow-md active:scale-95`}>
                   {editingId ? <><Save size={20} /> Update</> : <><Plus size={20} /> Deploy</>}
                </button>
              </div>
           </form>
        </div>

        {/* ========================================== */}
        {/* COUPON LIST DISPLAY */}
        {/* ========================================== */}
        <div className="lg:col-span-2 space-y-4">
           {loading ? (
             <div className="p-10 text-center text-gray-400 font-bold">Loading active campaigns...</div>
           ) : coupons.length === 0 ? (
             <div className="bg-white p-12 rounded-3xl border border-gray-100 border-dashed text-center flex flex-col items-center">
                <Ticket size={40} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold">No active promo codes. Deploy a campaign to get started.</p>
             </div>
           ) : (
             coupons.map((coupon) => (
                <div key={coupon.id} className={`bg-white p-5 md:p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group transition-colors ${editingId === coupon.id ? 'border-green-500 shadow-md ring-4 ring-green-50' : 'border-gray-100 hover:border-brand-blue'}`}>
                   
                   <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-canvas rounded-2xl flex flex-col items-center justify-center border border-gray-200 flex-shrink-0">
                         <span className="text-xl md:text-2xl font-black text-brand-blue">{coupon.discount}%</span>
                         <span className="text-[10px] text-gray-500 font-bold uppercase">OFF</span>
                      </div>
                      
                      <div className="flex-1">
                         <h3 className="text-xl font-black font-mono text-primary tracking-tight mb-1">{coupon.code}</h3>
                         
                         <div className="flex flex-wrap items-center gap-2 mt-2">
                           <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Active
                           </span>
                           {coupon.isFirstTimeOnly && (
                             <span className="px-2.5 py-1 bg-brand-orange/10 text-brand-orange rounded-md text-[10px] font-bold uppercase tracking-wider">
                               First-Time Only
                             </span>
                           )}
                           {coupon.maxUsesPerUser && (
                             <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md text-[10px] font-bold uppercase tracking-wider">
                               Limit: {coupon.maxUsesPerUser}/User
                             </span>
                           )}
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between w-full md:w-auto mt-4 md:mt-0 border-t md:border-none border-gray-100 pt-4 md:pt-0">
                     <div className="text-left md:text-right md:mr-6 flex-1 md:flex-none">
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Valid From</p>
                        <p className="text-xs font-bold text-primary">{coupon.startDate ? new Date(coupon.startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Immediately'}</p>
                        {coupon.endDate && (
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Until {new Date(coupon.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => handleEditClick(coupon)} className="p-3 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-xl transition-colors">
                           <Edit2 size={20} />
                        </button>
                        <button onClick={() => handleDelete(coupon.id)} className="p-3 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-colors">
                           <Trash2 size={20} />
                        </button>
                     </div>
                   </div>
                </div>
             ))
           )}
        </div>

      </div>
    </div>
  );
}