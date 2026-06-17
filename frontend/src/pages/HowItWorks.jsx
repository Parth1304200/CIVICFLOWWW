import React from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Footer } from '../components/layout/Footer';
import { FaUserPlus, FaFileAlt, FaSearch, FaCheckCircle } from 'react-icons/fa';

export function HowItWorks() {
  const steps = [
    { title: '1. Register & Login', icon: <FaUserPlus />, desc: 'Create an account using your email or Google login to access the platform securely.' },
    { title: '2. Lodge a Complaint', icon: <FaFileAlt />, desc: 'Select the category, provide a description, add a location, and optionally upload a photo.' },
    { title: '3. Track Status', icon: <FaSearch />, desc: 'Check your dashboard to see real-time updates and track the progress of your complaint.' },
    { title: '4. Resolution', icon: <FaCheckCircle />, desc: 'Once resolved, you will be notified and can provide feedback on the service.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicHeader />
      <main className="flex-1 w-full pb-20">
        <div className="bg-emerald-600 text-white py-16 px-6">
          <div className="max-w-[1200px] mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">How It Works</h1>
            <p className="text-emerald-50 max-w-2xl mx-auto text-lg">Four simple steps to make your city a better place.</p>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-6 mt-16 relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-emerald-100 -translate-y-1/2 z-0"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 text-center relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border-4 border-white shadow-sm">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
