import Link from "next/link";
import { ArrowLeft, RefreshCcw, Box, Clock, CreditCard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Exchange Policy | Ferixo",
  description: "Learn about Ferixo's 7-day return and exchange policy. We accept returns for both defective and non-defective items with zero restocking fees.",
};

export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      
      {/* Navigation */}
      <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors mb-8 md:mb-12">
        <ArrowLeft size={16} className="mr-2" /> Back to Home
      </Link>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter mb-4">
          Return & Exchange Policy
        </h1>
        <p className="text-gray-500 font-medium text-lg">
          We engineer premium products and stand by their quality. If you are not completely satisfied with your Ferixo purchase, we are here to help.
        </p>
      </div>

      {/* Policy Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
        
        <div className="bg-canvas border border-gray-100 p-6 md:p-8 rounded-3xl">
          <Clock className="text-brand-blue mb-4" size={28} />
          <h3 className="text-xl font-bold text-primary mb-2">7-Day Window</h3>
          <p className="text-gray-500 font-medium text-sm">
            You have 7 days from the date of delivery to initiate a return or exchange for any reason.
          </p>
        </div>

        <div className="bg-canvas border border-gray-100 p-6 md:p-8 rounded-3xl">
          <RefreshCcw className="text-brand-blue mb-4" size={28} />
          <h3 className="text-xl font-bold text-primary mb-2">All Returns Accepted</h3>
          <p className="text-gray-500 font-medium text-sm">
            We accept returns and exchanges for both defective products and non-defective products (change of mind).
          </p>
        </div>

        <div className="bg-canvas border border-gray-100 p-6 md:p-8 rounded-3xl">
          <Box className="text-brand-blue mb-4" size={28} />
          <h3 className="text-xl font-bold text-primary mb-2">Condition Requirements</h3>
          <p className="text-gray-500 font-medium text-sm">
            Returned items must be in strictly <strong>New</strong> condition, unused, and in their original packaging.
          </p>
        </div>

        <div className="bg-canvas border border-gray-100 p-6 md:p-8 rounded-3xl">
          <CreditCard className="text-brand-blue mb-4" size={28} />
          <h3 className="text-xl font-bold text-primary mb-2">Zero Restocking Fees</h3>
          <p className="text-gray-500 font-medium text-sm">
            We do not charge any restocking fees. You will receive a full refund for the qualifying returned items.
          </p>
        </div>

      </div>

      {/* Detailed Process */}
      <div className="prose prose-lg prose-blue max-w-none text-gray-600">
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">How to Return or Exchange</h2>
        <p className="mb-4">
          To initiate a return or exchange, please contact our support team within 7 days of receiving your order. We will provide you with the necessary authorization and instructions.
        </p>
        
        <h3 className="text-xl font-bold text-primary mt-8 mb-3">Return Method</h3>
        <p className="mb-4">
          All returns must be completed by bringing your packaged item to a designated <strong>drop-off location</strong>. Once you initiate your return with our support team, we will provide you with a shipping label and direct you to the nearest authorized drop-off point in India.
        </p>

        <h3 className="text-xl font-bold text-primary mt-8 mb-3">Refund Processing Time</h3>
        <p className="mb-4">
          Once your returned item is received at our facility and inspected to ensure it is in New condition, we will process your refund. Please allow up to <strong>7 days</strong> for the refund to be processed and reflected on your original payment method.
        </p>

        <h3 className="text-xl font-bold text-primary mt-8 mb-3">Contact Us</h3>
        <p className="mb-4">
          Ready to start a return? Contact our support team at <strong>info@ferixo.com</strong> with your order number.
        </p>
      </div>

    </div>
  );
}