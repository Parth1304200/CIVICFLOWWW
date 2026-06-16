import React from 'react';
import { Footer } from '../components/layout/Footer';

export function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-6">How It Works</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Simply register as a citizen, snap a geo-tagged photo of the civic issue, and submit it. Our municipal officers will pick it up, take action, and update the status in real-time.
        </p>
      </main>
      <Footer />
    </div>
  );
}
