"use client";
import { useState } from "react";
import { LifeBuoy, Mail, MapPin, ChevronDown } from "lucide-react";

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { q: "How long does shipping take?", a: "Orders are processed within 24 hours. Standard delivery across India takes 3-5 business days." },
    { q: "How do I track my order?", a: "Once your order ships, you will receive an email with your Blue Dart tracking number and a link to monitor its journey." },
    { q: "Is my Ferixo bottle dishwasher safe?", a: "To preserve the premium matte finish and the vacuum seal, we highly recommend hand-washing your Ferixo gear with warm, soapy water." },
    { q: "Do you offer a warranty?", a: "Yes, all Ferixo products come with a 1-year limited warranty covering manufacturing defects and vacuum insulation failure." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 pb-32">
      <div className="text-center mb-16">
        <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-6">
          <LifeBuoy size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-4">Help & Support</h1>
        <p className="text-lg text-gray-500 font-medium">How can we assist you today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <Mail size={32} className="text-brand-blue mb-4" />
          <h3 className="text-xl font-black text-primary mb-2">Email Us</h3>
          <p className="text-gray-500 font-medium mb-6">We aim to respond within 24 hours.</p>
          <a href="mailto:info@ferixo.com" className="text-brand-blue font-bold hover:underline">info@ferixo.com</a>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <MapPin size={32} className="text-brand-blue mb-4" />
          <h3 className="text-xl font-black text-primary mb-2">Headquarters</h3>
          <p className="text-gray-500 font-medium mb-6">Ferixo Operations</p>
          <p className="text-primary font-bold">Bathinda, Punjab, India<br/>151001</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-black text-primary">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 md:p-8">
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex justify-between items-center text-left focus:outline-none group">
                <span className="text-lg font-bold text-primary group-hover:text-brand-blue transition-colors">{faq.q}</span>
                <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${openFaq === idx ? "rotate-180 text-brand-blue" : ""}`} />
              </button>
              <div className={`mt-4 text-gray-500 font-medium leading-relaxed transition-all duration-300 ${openFaq === idx ? "block" : "hidden"}`}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}