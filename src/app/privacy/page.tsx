import Link from "next/link";
import { ArrowLeft, Shield, Eye, Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Ferixo",
  description: "Ferixo's Privacy Policy. Read how we secure your data, process payments, and protect your digital identity.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors mb-8 md:mb-12">
        <ArrowLeft size={16} className="mr-2" /> Back to Home
      </Link>

      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-500 font-medium text-lg mb-8">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="prose prose-lg prose-blue max-w-none text-gray-600 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-3 flex items-center gap-2"><Eye className="text-brand-blue"/> Information We Collect</h2>
          <p>We collect information that you provide directly to us when making a purchase or creating an account. This includes your name, email address, shipping address, and phone number. We also use <strong>Google Analytics</strong> to collect anonymous usage data (such as pages visited and device type) to improve our storefront experience.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-primary mb-3 flex items-center gap-2"><Lock className="text-brand-blue"/> Payment Security</h2>
          <p>We do not store your credit card details or UPI IDs on our servers. All financial transactions are encrypted and processed securely through <strong>Razorpay</strong>, our PCI-DSS compliant payment gateway.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-primary mb-3 flex items-center gap-2"><Shield className="text-brand-blue"/> How We Use Your Data</h2>
          <p>Your data is used strictly to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Process and fulfill your orders.</li>
            <li>Send transactional updates (like order confirmations and tracking links).</li>
            <li>Improve website performance and customer service.</li>
          </ul>
          <p className="mt-4"><strong>We never sell your personal data to third parties.</strong></p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-primary mb-3">Contact Us</h2>
          <p>If you have questions about your data or wish to request data deletion, please contact our privacy team at <strong>support@ferixo.com</strong>.</p>
        </div>
      </div>
    </div>
  );
}