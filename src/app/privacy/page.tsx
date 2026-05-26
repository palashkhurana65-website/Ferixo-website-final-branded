export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 pb-32">
      <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-4">Privacy Policy</h1>
      <p className="text-sm font-bold text-brand-blue mb-10 uppercase tracking-widest">Last Updated: May 2026</p>
      
      <div className="space-y-8 text-gray-500 font-medium leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-primary mb-3">Information We Collect</h2>
          <p>When you visit Ferixo, we automatically collect certain information about your device, including your web browser, IP address, and time zone. When you make a purchase, we collect your name, billing address, shipping address, payment information (securely processed via Razorpay), email address, and phone number.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">How We Use Your Information</h2>
          <p>We use the Order Information to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing invoices/order confirmations). We also use this information to communicate with you and screen our orders for potential risk or fraud.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">Data Security</h2>
          <p>Your personal information is encrypted and transmitted securely. We use industry-standard 256-bit SSL encryption to protect your data during checkout. We do not sell your personal data to third parties.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold text-primary mb-3">Contact Us</h2>
          <p>For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by email at info@ferixo.com.</p>
        </section>
      </div>
    </div>
  );
}