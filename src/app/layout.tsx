import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/storefront/Navbar";
import Footer from "../components/storefront/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ferixo.com"),
  title: {
    template: "%s | Ferixo", // Automatically appends the brand to other pages
    default: "Ferixo | Premium Insulated Drinkware & Lifestyle Gear",
  },
  description: "Minimalist, high-performance insulated bottles, tumblers, and coffee cups. Engineered to keep your focus sharp and your drinks ice-cold for 24 hours.",
  openGraph: {
    title: "Ferixo | Absolute Utility Guaranteed",
    description: "Premium insulated gear with matte aesthetics and studio-grade insulation.",
    url: "https://www.ferixo.com",
    siteName: "Ferixo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ferixo | Premium Insulated Drinkware",
    description: "Engineered for your daily commute.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-canvas text-primary flex flex-col min-h-screen">
        <Navbar />
        
        {/* flex-grow ensures the footer is always pushed to the bottom of the screen */}
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}