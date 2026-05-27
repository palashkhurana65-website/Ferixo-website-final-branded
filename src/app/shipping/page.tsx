import Link from "next/link";
import { ArrowLeft, Truck, Clock, MapPin, Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy | Ferixo",
  description: "Learn about Ferixo's fast, free shipping policy across India. View dispatch times and delivery estimates.",
};

export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors mb-8 md:mb-12">
        <ArrowLeft size={16} className="mr-2" /> Back to Home
      </Link>

      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter mb-4">
          Shipping Policy
        </h1>
        <p className="text-gray-500 font-medium text-lg">
          Fast, reliable delivery engineered for your convenience. Here is everything you need to know about how your Ferixo gear gets to you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
        <div className="bg-canvas border border-gray-100 p-6 md:p-8 rounded-3xl">
          <Truck className="text-brand-blue mb-4" size={28} />
          <h3 className="text-xl font-bold text-primary mb-2">Free Shipping</h3>
          <p className="text-gray-500 font-medium text-sm">
            We offer <strong>100% Free Standard Shipping</strong> on all orders across India. No minimum purchase required.
          </p>
        </div>
        <div className="bg-canvas border border-gray-100 p-6 md:p-8 rounded-3xl">
          <Clock className="text-brand-blue mb-4" size={28} />
          <h3 className="text-xl font-bold text-primary mb-2">Dispatch Time</h3>
          <p className="text-gray-500 font-medium text-sm">
            Orders are processed and dispatched within <strong>1 to 2 business days</strong> (excluding weekends and public holidays).
          </p>
        </div>
        <div className="bg-canvas border border-gray-100 p-6 md:p-8 rounded-3xl">
          <MapPin className="text-brand-blue mb-4" size={28} />
          <h3 className="text-xl font-bold text-primary mb-2">Delivery Speed</h3>
          <p className="text-gray-500 font-medium text-sm">
            Once dispatched, standard delivery typically takes <strong>3 to 5 business days</strong> depending on your PIN code.
          </p>
        </div>
        <div className="bg-canvas border border-gray-100 p-6 md:p-8 rounded-3xl">
          <Package className="text-brand-blue mb-4" size={28} />
          <h3 className="text-xl font-bold text-primary mb-2">Tracking</h3>
          <p className="text-gray-500 font-medium text-sm">
            You will receive a tracking link via email the moment your premium gear leaves our facility.
          </p>
        </div>
      </div>
    </div>
  );
}