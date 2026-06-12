import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string; 
  productId: string;
  name: string;
  shortName?: string;
  price: number;
  quantity: number;
  image: string;
  variantName: string;
};

// 🚀 NEW: Milestone Type definition
export type Milestone = {
  id: string;
  name: string;
  thresholdAmount: number;
  rewardType: 'discount_percentage' | 'discount_fixed' | 'free_product';
  rewardValue: string;
};

interface CartState {
  items: CartItem[];
  activeMilestone: Milestone | null; // 🚀 NEW
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  fetchActiveMilestone: () => Promise<void>; // 🚀 NEW
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      activeMilestone: null,
      
      addItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id);
        if (existingItem) {
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i))
      })),
      clearCart: () => set({ items: [] }),

      // 🚀 NEW: Fetches the live milestone from the database
      fetchActiveMilestone: async () => {
        try {
          const res = await fetch('/api/rewards');
          if (res.ok) {
            const rewards = await res.json();
            const active = rewards.find((r: any) => r.isActive);
            set({ activeMilestone: active || null });
          }
        } catch (error) {
          console.error("Failed to fetch milestone", error);
        }
      }
    }),
    { 
      name: 'ferixo-cart',
      // 🚀 NEW: Ensures ONLY cart items are saved to localStorage, so milestones always stay fresh
      partialize: (state) => ({ items: state.items }),
    } 
  )
);