import HeroCarousel from "../components/HeroCarousel";
import FeaturesCinematic from "../components/FeaturesCinematic";
import ProductCategories from "../components/ProductCategories";

export default function Home() {
  return (
    <main className="w-full flex flex-col min-h-screen">
      
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Cinematic Brand Features */}
      <FeaturesCinematic />

      {/* 3. Dynamic Product Shelves */}
      <ProductCategories />

    </main>
  );
}