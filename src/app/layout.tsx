import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/storefront/Navbar";
import Footer from "../components/storefront/Footer";

export const metadata: Metadata = {
  title: "Ferixo | Premium Insulated Gear",
  description: "Engineered for utility, designed for life. Shop premium insulated bottles, tumblers, and cups.",
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