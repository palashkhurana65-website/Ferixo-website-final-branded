"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, X, Image as ImageIcon, Trash2, Plus } from "lucide-react";

type VariantOption = { id?: string; colorName: string; stock: number; images: string[]; colorCode: string; price: number | null; mrp: number | null };
type VariantGroup = { capacity: string; options: VariantOption[] };

export default function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const productId = unwrappedParams.id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // NEW: Error state
  const [activeVariantIndices, setActiveVariantIndices] = useState<{g: number, o: number} | null>(null);

  const [formData, setFormData] = useState<any>({
    name: "", shortName: "", description: "", basePrice: 0, mrp: 0, stock: 0, category: "", images: [""], features: [""]
  });

  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([
    { capacity: "Standard", options: [{ colorName: "", stock: 0, images: [], colorCode: "#121212", price: null, mrp: null }] }
  ]);
  
  // NEW: Auto-calculate total stock whenever variantGroups change
  // NEW: Auto-calculate total stock whenever variantGroups change
  useEffect(() => {
    const totalStock = variantGroups.reduce((acc, group) => {
      return acc + group.options.reduce((sum, opt) => sum + (Number(opt.stock) || 0), 0);
    }, 0);
    setFormData((prev: any) => ({ ...prev, stock: totalStock }));
  }, [variantGroups]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (productId === "new") { setLoading(false); return; }
      try {
        const res = await fetch(`/api/products/${productId}?t=${Date.now()}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        
        setFormData({
            id: data.id, name: data.name || "",shortName: data.shortName || "", description: data.description || "",
            basePrice: data.basePrice || 0, mrp: data.mrp || 0, stock: data.stock || 0,
            category: data.category || "", 
            images: data.images?.length ? data.images : [""],
            features: data.features?.length ? data.features : [""],
        });

        if (data.variants && data.variants.length > 0) {
            const groups: Record<string, VariantOption[]> = {};
            data.variants.forEach((v: any) => {
                const cap = v.capacity || "Standard";
                if (!groups[cap]) groups[cap] = [];
                let vImages: string[] = [];
                if (Array.isArray(v.images)) vImages = v.images;
                else if (typeof v.images === 'string') { try { vImages = JSON.parse(v.images); } catch(e) { vImages = [v.images]; } }

                groups[cap].push({ 
                    id: v.id, 
                    colorName: v.colorName || "", // FIXED: Was v.name
                    stock: v.stock || 0, 
                    images: vImages,
                    colorCode: v.colorCode || "#121212", 
                    price: v.price || null, 
                    mrp: v.mrp || null
                });
            });
            setVariantGroups(Object.entries(groups).map(([capacity, options]) => ({ capacity, options })));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchProduct();
  }, [productId]);

  const handleSave = async () => {
    setError(null); // Clear old errors

    // 1. Strict Validation
    if (!formData.name || !formData.shortName) return setError("Both SEO Name and Short Name are required.");
    if (!formData.category) return setError("Please select a product category.");
    if (formData.basePrice <= 0) return setError("Base selling price must be greater than 0.");
    if (!formData.images[0]) return setError("Please provide a Primary Image Path.");

    for (const group of variantGroups) {
      if (!group.capacity) return setError("All variant groups must have a Capacity (e.g., 500ml).");
      for (const opt of group.options) {
        if (!opt.colorName) return setError(`Missing color name for the ${group.capacity} variant.`);
      }
    }

    // 2. Package Data (Fixing the colorName mismatch)
    const flatVariants = variantGroups.flatMap(group => 
        group.options.map(opt => ({
            ...(opt.id ? { id: opt.id } : {}), 
            colorName: opt.colorName, // FIXED: Now matches the database column
            capacity: group.capacity, 
            stock: opt.stock, 
            images: opt.images.filter(i => i !== ""), 
            colorCode: opt.colorCode, 
            price: opt.price, 
            mrp: opt.mrp      
        }))
    );
    
    const totalStock = flatVariants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    const payload = { 
        ...formData, stock: totalStock, variants: flatVariants, 
        images: formData.images.filter((i: string) => i !== ""), 
        features: formData.features.filter((f: string) => f !== "") 
    };

    // 3. Fire to API
    try {
      const url = productId === "new" ? '/api/products' : `/api/products/${productId}`;
      const res = await fetch(url, { 
        method: productId === "new" ? 'POST' : 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      // NEW: Check if the response is actually JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Route error: Expected JSON, but got HTML (Check terminal for 404 or 500)`);
      }

      const responseData = await res.json(); 
      
      if (!res.ok) {
        throw new Error(`Database Error: ${responseData.error}`);
      }
      
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) { 
      setError(err.message || "Error saving product. Check console."); 
    }
  };
    
  // NEW: Delete handler
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to completely delete this product? This action cannot be undone.")) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete product.");
      
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error deleting product.");
    }
  }; 

  if (loading) return <div className="p-10 md:p-20 text-primary text-center font-bold text-xl">Loading Editor...</div>;
  
  return (
    <div className="pb-20 max-w-6xl mx-auto">
      
      {/* HEADEr */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8 bg-white p-4 md:p-0 rounded-2xl md:bg-transparent md:rounded-none border border-gray-100 md:border-none shadow-sm md:shadow-none">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-3 bg-white md:border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft size={20} className="text-primary" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">{productId === "new" ? "New Product" : "Edit Product"}</h1>
          </div>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          {productId !== "new" && (
            <button onClick={handleDelete} className="flex-1 md:flex-none bg-white text-brand-orange border border-brand-orange/30 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-50 transition-all shadow-sm active:scale-95">
              <Trash2 size={18} /> Delete
            </button>
          )}
          <button onClick={handleSave} className="flex-1 md:flex-none bg-brand-blue text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95">
            <Save size={18} /> Save
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-orange-50 text-brand-orange p-4 rounded-2xl text-sm font-bold mb-6 border border-brand-orange/20 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-brand-orange hover:text-red-700"><X size={18}/></button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: BASIC INFO */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-primary mb-6">Basic Information</h2>
                <div className="space-y-5">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div>
        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">SEO Full Name</label>
        <input 
          type="text" 
          placeholder="e.g. Ferixo ThermoSmart Insulated Bottle 500ml"
          className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary focus:border-brand-blue outline-none font-medium text-[16px]" 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
        />
    </div>
    <div>
        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Short Name (UI/Breadcrumbs)</label>
        <input 
          type="text" 
          placeholder="e.g. ThermoSmart"
          className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary focus:border-brand-blue outline-none font-medium text-[16px]" 
          value={formData.shortName} 
          onChange={(e) => setFormData({...formData, shortName: e.target.value})} 
        />
    </div>
</div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Category</label>
                        <select 
                          className={`w-full bg-canvas border border-gray-200 rounded-xl p-4 outline-none focus:border-brand-blue font-medium text-[16px] cursor-pointer ${formData.category === "" ? "text-gray-400" : "text-primary"}`} 
                          value={formData.category} 
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="" disabled>Select Category</option>
                            <option value="Bottles">Bottles</option>
                            <option value="Tumblers">Tumblers</option>
                            <option value="Coffee Cups">Coffee Cups</option>
                            <option value="Makeup Organizers">Makeup Organizers</option>
                            <option value="Creator Accessories">Creator Accessories</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Description</label>
                        <textarea rows={5} className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none resize-none focus:border-brand-blue font-medium text-[16px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="flex-1">
  <label className="text-xs uppercase text-gray-500 font-bold block mb-2">Primary Image Path</label>
  <input 
    type="text" 
    placeholder="/images/thermosmart/1.jpg"
    className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium text-[16px] placeholder:text-gray-400" 
    value={formData.images[0] || ""} 
    onChange={(e) => {
      const newImages = [...formData.images];
      newImages[0] = e.target.value;
      setFormData({...formData, images: newImages});
    }} 
  />
  <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide">Must be stored in public/images/</p>
</div>
                </div>
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">Features List</h2>
                <div className="space-y-3">
                    {formData.features?.map((feat: string, i: number) => (
                        <div key={i} className="flex gap-3 items-center">
                            <input type="text" className="flex-1 bg-canvas border border-gray-200 rounded-xl p-4 text-[16px] text-primary outline-none focus:border-brand-blue font-medium" placeholder={`Feature ${i+1}`} value={feat} onChange={(e) => { const n = [...formData.features]; n[i] = e.target.value; setFormData({...formData, features: n}); }} />
                            <button onClick={() => { const n = [...formData.features]; n.splice(i, 1); setFormData({...formData, features: n}); }} className="p-4 text-brand-orange hover:bg-orange-50 rounded-xl bg-canvas"><X size={20} /></button>
                        </div>
                    ))}
                    <button onClick={() => setFormData({...formData, features: [...formData.features, ""]})} className="text-sm bg-canvas text-brand-blue font-bold px-4 py-3 rounded-xl border border-gray-200 hover:border-brand-blue w-full flex justify-center items-center gap-2"><Plus size={16}/> Add Feature</button>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: PRICING & VARIANTS */}
        <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-primary mb-6">Market Data</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Selling (₹)</label>
                        <input type="number" className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary font-mono text-lg outline-none focus:border-brand-blue font-semibold" value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: parseInt(e.target.value) || 0})} />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">MRP (₹)</label>
                        <input type="number" className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary font-mono text-lg outline-none focus:border-brand-blue font-semibold" value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: parseInt(e.target.value) || 0})} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Total Stock</label>
                    <input type="number" className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-gray-400 font-mono text-lg outline-none cursor-not-allowed font-semibold" value={formData.stock} disabled />
                </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-primary">Variants</h2>
                    <button onClick={() => setVariantGroups([...variantGroups, { capacity: "New Size", options: [{ colorName: "", stock: 0, images: [], colorCode: "#121212", price: null, mrp: null }] }])} className="text-xs bg-brand-blue text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm">+ Add Size</button>
                </div>
                <div className="space-y-6">
                    {variantGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="bg-canvas p-4 rounded-2xl border border-gray-200">
                            <div className="flex gap-3 items-center mb-4 border-b border-gray-200 pb-4">
                                <input type="text" className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-primary font-bold outline-none focus:border-brand-blue text-[16px]" placeholder="Capacity (e.g. 500ml)" value={group.capacity} onChange={(e) => { const ng = [...variantGroups]; ng[groupIdx].capacity = e.target.value; setVariantGroups(ng); }} />
                                <button onClick={() => setVariantGroups(variantGroups.filter((_, i) => i !== groupIdx))} className="text-brand-orange p-3 rounded-xl bg-white border border-gray-200"><Trash2 size={18} /></button>
                            </div>
                            <div className="space-y-3">
                                {group.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex gap-3 items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                                        <input type="color" className="w-10 h-10 rounded-lg cursor-pointer bg-canvas border border-gray-200" value={opt.colorCode || "#121212"} onChange={(e) => { const ng = [...variantGroups]; ng[groupIdx].options[optIdx].colorCode = e.target.value; setVariantGroups(ng); }} />
                                        <div className="flex-1">
                                            <input 
                                              type="text" 
                                              placeholder="Color Name" 
                                              className="w-full bg-transparent text-primary text-[16px] font-bold outline-none" 
                                              value={opt.colorName} 
                                              onChange={(e) => { 
                                                const ng = [...variantGroups]; 
                                                ng[groupIdx].options[optIdx].colorName = e.target.value; 
                                                setVariantGroups(ng); 
                                              }} 
                                            />
                                        </div>
                                        <button onClick={() => setActiveVariantIndices({ g: groupIdx, o: optIdx })} className="p-2.5 bg-canvas text-brand-blue rounded-lg font-bold hover:bg-blue-50 transition-colors" title="Edit Variant Details">
                                            <ImageIcon size={20}/>
                                        </button>
                                        <button 
                                          onClick={() => { 
                                            const ng = [...variantGroups]; 
                                            ng[groupIdx].options = ng[groupIdx].options.filter((_, i) => i !== optIdx); 
                                            setVariantGroups(ng); 
                                          }} 
                                          className="p-2.5 bg-canvas text-brand-orange rounded-lg font-bold hover:bg-orange-50 transition-colors" 
                                          title="Delete Color"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                                <button 
  onClick={() => { 
    const ng = [...variantGroups]; 
    ng[groupIdx].options.push({ colorName: "", stock: 0, images: [], colorCode: "#121212", price: null, mrp: null }); 
    setVariantGroups(ng); 
  }} 
  className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 font-bold hover:border-brand-blue hover:text-brand-blue bg-white"
>
  + Add Color
</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* MOBILE FULL-SCREEN / DESKTOP MODAL FOR VARIANTS */}
      {activeVariantIndices && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-primary/40 backdrop-blur-sm md:p-4">
           <div className="bg-white md:border border-gray-100 w-full max-w-xl rounded-t-3xl md:rounded-3xl p-6 md:p-8 shadow-2xl h-[90vh] md:h-auto overflow-y-auto slide-up-mobile">
              <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4 sticky top-0 bg-white z-10 pt-2 md:pt-0">
                 <h3 className="text-xl font-bold text-primary">Variant Details</h3>
                 <button onClick={() => setActiveVariantIndices(null)} className="p-2 bg-canvas rounded-xl text-gray-500 hover:text-brand-orange"><X size={24} /></button>
              </div>

              <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                    <label className="text-xs uppercase text-gray-500 font-bold block mb-2">Override Price (₹)</label>
                    <input 
                      type="number" 
                      placeholder="Optional" 
                      className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary font-mono text-[16px] outline-none focus:border-brand-blue" 
                      value={activeVariantIndices ? (variantGroups[activeVariantIndices.g].options[activeVariantIndices.o].price || "") : ""} 
                      onChange={(e) => { 
                        if (!activeVariantIndices) return;
                        const ng = [...variantGroups]; 
                        ng[activeVariantIndices.g].options[activeVariantIndices.o].price = parseInt(e.target.value) || null; 
                        setVariantGroups(ng); 
                      }} 
                    />
                 </div>
                 <div>
                    <label className="text-xs uppercase text-gray-500 font-bold block mb-2">Override MRP (₹)</label>
                    <input 
                      type="number" 
                      placeholder="Optional" 
                      className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary font-mono text-[16px] outline-none focus:border-brand-blue" 
                      value={activeVariantIndices ? (variantGroups[activeVariantIndices.g].options[activeVariantIndices.o].mrp || "") : ""} 
                      onChange={(e) => { 
                        if (!activeVariantIndices) return;
                        const ng = [...variantGroups]; 
                        ng[activeVariantIndices.g].options[activeVariantIndices.o].mrp = parseInt(e.target.value) || null; 
                        setVariantGroups(ng); 
                      }} 
                    />
                 </div>
                 <div>
                    <label className="text-xs uppercase text-gray-500 font-bold block mb-2">Variant Stock</label>
                    <input 
                      type="number" 
                      className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary font-mono text-[16px] outline-none focus:border-brand-blue font-bold" 
                      value={activeVariantIndices ? variantGroups[activeVariantIndices.g].options[activeVariantIndices.o].stock : ""} 
                      onChange={(e) => { 
                        if (!activeVariantIndices) return;
                        const ng = [...variantGroups]; 
                        ng[activeVariantIndices.g].options[activeVariantIndices.o].stock = parseInt(e.target.value) || 0; 
                        setVariantGroups(ng); 
                      }} 
                    />
                 </div>
              </div>

              <div>
                 <div className="flex justify-between items-end mb-4">
                    <label className="text-xs uppercase text-gray-500 font-bold">Image Gallery (URLs)</label>
                 </div>
                 <div className="space-y-3 mb-6">
                    {variantGroups[activeVariantIndices.g].options[activeVariantIndices.o].images?.map((img, imgIdx) => (
                        <div key={imgIdx} className="flex gap-3 items-center">
                            <input 
  type="text" 
  placeholder="/images/thermosmart/red-1.jpg" 
  className="flex-1 bg-canvas border border-gray-200 rounded-xl p-4 text-primary text-[16px] outline-none focus:border-brand-blue placeholder:text-gray-400" 
  value={img} 
  onChange={(e) => { 
    const ng = [...variantGroups]; 
    ng[activeVariantIndices.g].options[activeVariantIndices.o].images[imgIdx] = e.target.value; 
    setVariantGroups(ng); 
  }} 
/>
                            <button onClick={() => { const ng = [...variantGroups]; ng[activeVariantIndices.g].options[activeVariantIndices.o].images.splice(imgIdx, 1); setVariantGroups(ng); }} className="p-4 text-brand-orange hover:bg-orange-50 rounded-xl bg-canvas border border-gray-200"><Trash2 size={20} /></button>
                        </div>
                    ))}
                    <button onClick={() => { const ng = [...variantGroups]; ng[activeVariantIndices.g].options[activeVariantIndices.o].images.push(""); setVariantGroups(ng); }} className="w-full bg-canvas text-brand-blue font-bold p-4 rounded-xl border border-dashed border-gray-300 hover:border-brand-blue">+ Add Image URL</button>
                 </div>
              </div>
              <button onClick={() => setActiveVariantIndices(null)} className="w-full p-4 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-700 shadow-md">Done</button>
           </div>
        </div>
      )}
    </div>
  );
}