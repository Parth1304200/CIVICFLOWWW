import React, { useState } from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Footer } from '../components/layout/Footer';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

export function FAQs() {
  const faqs = [
    { q: 'How long does it take to resolve a complaint?', a: 'Resolution times vary by category. Urgent issues like water leaks are typically addressed within 24-48 hours, while structural road repairs may take 7-14 days.' },
    { q: 'Can I submit a complaint anonymously?', a: 'No, to prevent spam and ensure accountability, you must log in to submit a complaint. However, your personal details are kept confidential.' },
    { q: 'What happens if my complaint is marked resolved but isn\'t?', a: 'You can reopen the complaint within 3 days of it being marked resolved and provide comments or photos showing the issue persists.' },
    { q: 'Is there a mobile app available?', a: 'Currently, Civic Flow is a responsive web portal accessible on any mobile browser. A dedicated app is in development.' },
    { q: 'Who do I contact for technical support?', a: 'If you experience issues using the portal, please reach out via our Contact page or email support@civicsense.com.' }
  ];

  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicHeader />
      <main className="flex-1 w-full pb-20">
        <div className="bg-purple-600 text-white py-16 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">Frequently Asked Questions</h1>
            <p className="text-purple-100 text-lg">Find answers to common questions about using Civic Flow.</p>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-6 mt-12 space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button 
                className="w-full text-left px-6 py-4 flex justify-between items-center font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              >
                {faq.q}
                {openIdx === idx ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-4 pt-2 text-slate-600 border-t border-slate-100 bg-slate-50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
