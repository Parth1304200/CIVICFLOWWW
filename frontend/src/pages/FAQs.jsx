import React from 'react';
import { Footer } from '../components/layout/Footer';

export function FAQs() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Got questions? We have answers. Check back soon for our comprehensive list of frequently asked questions regarding civic issue reporting and platform usage.
        </p>
      </main>
      <Footer />
    </div>
  );
}
