import HeroCarousel from "../components/HeroCarousel";
import FeaturesCinematic from "../components/FeaturesCinematic";
import ProductCategories from "../components/ProductCategories";
import type { Metadata } from "next";
import GoogleReviews from "../components/storefront/GoogleReviews";
import ReviewCarousel from "../components/storefront/ReviewCarousel";



export const metadata: Metadata = {
  title: "Ferixo | Premium Insulated Bottles & Tumblers",
  description: "Discover Ferixo's premium line of minimalist insulated drinkware. Matte black aesthetics meet ultimate thermal performance.",
  alternates: {
    canonical: "/",
  },
};
export default function Home() {
  return (
    <main className="w-full flex flex-col min-h-screen">
      
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Cinematic Brand Features */}
      <FeaturesCinematic />

      {/* 3. Dynamic Product Shelves */}
      <ProductCategories />
      <ReviewCarousel />
    </main> 
  );
}