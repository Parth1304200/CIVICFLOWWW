import React from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Footer } from '../components/layout/Footer';
import { motion } from 'framer-motion';
import { FaInfoCircle, FaLeaf, FaShieldAlt, FaUsers } from 'react-icons/fa';

export function About() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicHeader />
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <div className="bg-blue-600 text-white py-20 px-6">
          <div className="max-w-[1000px] mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black mb-6"
            >
              About Civic Flow
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl font-medium text-blue-100 max-w-2xl mx-auto leading-relaxed"
            >
              Empowering the citizens of Delhi to actively participate in maintaining and improving their city's infrastructure and environment.
            </motion.p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-[1000px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Civic Flow is an initiative by the Government of NCT of Delhi aimed at streamlining public grievances and ensuring a cleaner, safer, and better environment for all citizens. We bridge the gap between citizens and civic authorities through transparent, fast, and accountable digital reporting.
              </p>
              <p className="text-slate-600 leading-relaxed">
                By leveraging modern technology, we ensure that every complaint reaches the right department and is resolved within stipulated timelines, with full visibility provided to the citizen.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
              <FaInfoCircle className="w-32 h-32 text-blue-100" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLeaf className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-2">Sustainability</h3>
              <p className="text-slate-500 text-sm">Committed to environmental health and a greener Delhi for future generations.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-2">Accountability</h3>
              <p className="text-slate-500 text-sm">Every issue is tracked and strictly monitored to ensure guaranteed resolution.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-2">Community</h3>
              <p className="text-slate-500 text-sm">Built on the power of community involvement and active citizen participation.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
