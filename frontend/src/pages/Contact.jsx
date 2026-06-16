import React from 'react';
import { Footer } from '../components/layout/Footer';

export function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Contact Us</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Need assistance? Reach out to the Civic Flow support team via email at support@civicflow.gov.in or call our toll-free helpline at 1800-11-2233.
        </p>
      </main>
      <Footer />
    </div>
  );
}
