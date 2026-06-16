import React from 'react';
import { Footer } from '../components/layout/Footer';

export function About() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-6">About Civic Flow</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Civic Flow is an initiative by the Government of NCT of Delhi to streamline public grievances and ensure a cleaner, safer, and better environment for all citizens.
        </p>
      </main>
      <Footer />
    </div>
  );
}
