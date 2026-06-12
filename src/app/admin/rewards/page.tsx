"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Trophy, Percent, Gift } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";

type Reward = {
  id: string;
  name: string;
  thresholdAmount: number;
  rewardType: 'discount_percentage' | 'discount_fixed' | 'free_product';
  rewardValue: string;
  isActive: boolean;
};

export default function RewardsAdminPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [products, setProducts] = useState<any[]>([]); // To populate the dropdown if offering a free product
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Reward Form State
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    thresholdAmount: 1000,
    // 🚀 FIXED: Tells TypeScript this variable can be any of these three specific strings
    rewardType: "discount_percentage" as "discount_percentage" | "discount_fixed" | "free_product",
    rewardValue: "",
    isActive: false
  });

  const fetchData = async () => {
    try {
      const [rewardsRes, productsRes] = await Promise.all([
        fetch('/api/rewards'),
        createClient().from('Product').select('id, name, shortName')
      ]);
      
      if (rewardsRes.ok) setRewards(await rewardsRes.json());
      if (productsRes.data) setProducts(productsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/rewards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) {
         // Optimistic update: Deactivate others, activate selected
         setRewards(prev => prev.map(r => ({
             ...r,
             isActive: r.id === id ? !currentActive : false
         })));
      }
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this milestone forever?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/rewards/${id}`, { method: "DELETE" });
      if (res.ok) setRewards(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsCreating(false);
        setFormData({ name: "", thresholdAmount: 1000, rewardType: "discount_percentage", rewardValue: "", isActive: false });
        fetchData(); // Refresh list
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Milestone Rewards</h1>
          <p className="text-gray-500 mt-2">Gamify the checkout experience to increase AOV.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)} 
          className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          {isCreating ? "Cancel" : <><Plus size={18} /> New Milestone</>}
        </button>
      </div>

      {/* CREATION FORM (Slide Down) */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-brand-blue/20 shadow-lg shadow-brand-blue/5 mb-8 slide-in-from-top-2 animate-in duration-300">
           <h2 className="text-xl font-bold text-primary mb-6">Create New Milestone Offer</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Campaign Name (Internal)</label>
                <input required type="text" placeholder="e.g. Summer Tumbler Promo" className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Cart Threshold (₹)</label>
                <input required type="number" min="1" className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-mono" value={formData.thresholdAmount} onChange={e => setFormData({...formData, thresholdAmount: parseInt(e.target.value) || 0})} />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-t border-gray-100 pt-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Reward Type</label>
                <select className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-bold cursor-pointer" value={formData.rewardType} onChange={e => setFormData({...formData, rewardType: e.target.value as any, rewardValue: ""})}>
                  <option value="discount_percentage">Percentage Discount (%)</option>
                  <option value="discount_fixed">Flat Discount (₹)</option>
                  <option value="free_product">Free Product Gift</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Reward Value</label>
                {formData.rewardType === 'free_product' ? (
                   <select required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue" value={formData.rewardValue} onChange={e => setFormData({...formData, rewardValue: e.target.value})}>
                     <option value="" disabled>Select the free gift product...</option>
                     {products.map(p => <option key={p.id} value={p.id}>{p.shortName || p.name}</option>)}
                   </select>
                ) : (
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                       {formData.rewardType === 'discount_percentage' ? '%' : '₹'}
                     </span>
                     <input required type="number" min="1" className="w-full bg-canvas border border-gray-200 rounded-xl p-4 pl-10 text-primary outline-none focus:border-brand-blue font-mono" value={formData.rewardValue} onChange={e => setFormData({...formData, rewardValue: e.target.value})} />
                   </div>
                )}
              </div>
           </div>

           <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                 <p className="font-bold text-primary text-sm">Activate Immediately?</p>
                 <p className="text-xs text-gray-500">This will automatically deactivate any currently active milestone.</p>
              </div>
              <button type="button" onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                 <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
           </div>

           <button type="submit" disabled={loading} className="w-full mt-6 bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
             Save Milestone Rule
           </button>
        </form>
      )}

      {/* REWARDS LIST */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {loading && !isCreating ? (
          <div className="p-12 text-center text-gray-500 font-bold flex flex-col items-center gap-3"><Loader2 className="animate-spin" size={32} /> Loading...</div>
        ) : rewards.length === 0 ? (
          <div className="p-16 text-center">
             <Trophy size={48} className="mx-auto text-gray-200 mb-4" />
             <h3 className="text-xl font-bold text-primary">No Milestones Found</h3>
             <p className="text-gray-500 mt-2">Create your first milestone to encourage customers to spend more.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-6 font-bold">Campaign</th>
                <th className="p-6 font-bold">Threshold & Reward</th>
                <th className="p-6 font-bold text-center">Status</th>
                <th className="p-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rewards.map((reward) => (
                  <tr key={reward.id} className={`hover:bg-gray-50/50 transition-colors ${actionLoading === reward.id ? 'opacity-50' : ''}`}>
                    <td className="p-6 align-middle">
                      <p className="font-bold text-primary">{reward.name}</p>
                    </td>
                    <td className="p-6 align-middle">
                      <div className="flex items-center gap-4">
                        <span className="font-black text-brand-orange bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">₹{reward.thresholdAmount.toLocaleString('en-IN')}</span>
                        <span className="text-gray-300 font-bold">→</span>
                        <div className="flex items-center gap-2 font-bold text-brand-blue">
                          {reward.rewardType === 'free_product' ? <Gift size={16}/> : <Percent size={16}/>}
                          {reward.rewardType === 'free_product' 
                             ? (products.find(p => p.id === reward.rewardValue)?.shortName || 'Free Gift')
                             : `${reward.rewardValue}${reward.rewardType === 'discount_percentage' ? '%' : '₹'} OFF`
                          }
                        </div>
                      </div>
                    </td>
                    <td className="p-6 align-middle text-center">
                      <button 
                        onClick={() => handleToggleActive(reward.id, reward.isActive)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${reward.isActive ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                      >
                        {reward.isActive ? 'LIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="p-6 align-middle text-right">
                      <button onClick={() => handleDelete(reward.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={18} /></button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}