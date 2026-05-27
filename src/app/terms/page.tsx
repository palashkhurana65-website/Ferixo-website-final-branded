import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Ferixo",
  description: "Terms and conditions for using the Ferixo storefront and purchasing our premium engineered gear.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 pb-32">
      <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors mb-8 md:mb-12">
        <ArrowLeft size={16} className="mr-2" /> Back to Home
      </Link>

      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter mb-4">
          Terms of Service
        </h1>
      </div>

      <div className="prose prose-lg prose-blue max-w-none text-gray-600 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-3 flex items-center gap-2"><FileText className="text-brand-blue"/> 1. General Conditions</h2>
          <p>By visiting our site and/or purchasing something from us, you engage in our "Service" and agree to be bound by the following terms and conditions. We reserve the right to refuse service to anyone for any reason at any time.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-primary mb-3">2. Products & Pricing</h2>
          <p>Prices for our products are subject to change without notice. We reserve the right to modify or discontinue a product without notice at any time. We have made every effort to display the colors and images of our products as accurately as possible; however, we cannot guarantee that your computer monitor's display of any color will be perfectly accurate.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-primary mb-3">3. Billing & Account Information</h2>
          <p>You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store. We reserve the right to refuse any order you place with us, which may occur in the event of suspected fraud or unauthorized reseller activity.</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-primary mb-3">4. Limitation of Liability</h2>
          <p>In no case shall Ferixo, our directors, officers, employees, or affiliates be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, or consequential damages arising from your use of any of the service or any products procured using the service.</p>
        </div>
      </div>
    </div>
  );
}