import React from 'react';
import { Footer } from '../components/layout/Footer';

export function Services() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Our Services</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          We offer robust public grievance redressal mechanisms, including real-time issue tracking, geo-tagged reporting, and direct integration with municipal authorities.
        </p>
      </main>
      <Footer />
    </div>
  );
}
