import { MapPin, Check, ArrowRight } from "lucide-react";

export default function CheckoutAddress({
  formData, handleFormChange, handleAddressSubmit, fetchingPin, 
  loadingAddresses, savedAddresses, selectedAddressId, 
  handleSelectSavedAddress, userProfile
}: any) {
  return (
    <form onSubmit={handleAddressSubmit} className="p-6 md:p-10 space-y-6 slide-up-mobile">
      <h2 className="text-2xl font-black text-primary flex items-center gap-3"><MapPin className="text-brand-blue" /> Shipping Information</h2>
      
      {!loadingAddresses && savedAddresses.length > 0 && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-bold">Your Saved Addresses</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedAddresses.map((addr: any) => (
              <div 
                key={addr.id} 
                onClick={() => handleSelectSavedAddress(addr)}
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all text-left ${selectedAddressId === addr.id ? 'border-brand-blue bg-blue-50' : 'border-gray-200 bg-canvas hover:border-gray-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${selectedAddressId === addr.id ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {addr.label || 'Home'}
                  </span>
                  {selectedAddressId === addr.id && <Check size={16} className="text-brand-blue" />}
                </div>
                <p className="text-sm font-bold text-primary">{userProfile?.fullName}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{addr.address}, {addr.city}, {addr.state} - {addr.pin}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Or enter new address</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Full Name</label>
          <input type="text" required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium" value={formData.fullName} onChange={(e) => handleFormChange('fullName', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Email Address</label>
          <input type="email" required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium" value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Phone Number</label>
        <input type="tel" required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative">
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">PIN Code</label>
          <input type="text" required maxLength={6} className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium" value={formData.pin} onChange={(e) => handleFormChange('pin', e.target.value)} />
          {fetchingPin && <MapPin size={16} className="absolute right-4 top-1/2 mt-3 text-brand-blue animate-pulse" />}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">City</label>
          <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-primary outline-none font-medium" value={formData.city} onChange={(e) => handleFormChange('city', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">State</label>
          <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-primary outline-none font-medium" value={formData.state} onChange={(e) => handleFormChange('state', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Street Address</label>
        <textarea rows={3} required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium resize-none" value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} />
      </div>
      <button type="submit" className="w-full bg-primary text-white py-4.5 rounded-2xl font-black text-lg hover:bg-gray-900 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4">
        Continue to Summary <ArrowRight size={20} />
      </button>
    </form>
  );
}