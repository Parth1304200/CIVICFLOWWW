import React from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Footer } from '../components/layout/Footer';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

export function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicHeader />
      <main className="flex-1 w-full pb-20">
        <div className="bg-slate-800 text-white py-16 px-6">
          <div className="max-w-[1200px] mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">Contact Us</h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg">We are here to help. Reach out to the right department for your queries.</p>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Details */}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Get In Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 text-xl">
                  <FaPhoneAlt />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Toll-Free Helpline</h3>
                  <p className="text-slate-600">1800-11-2233 (Available 24x7)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 text-xl">
                  <FaEnvelope />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Email Support</h3>
                  <p className="text-slate-600">support@civicflow.delhi.gov.in</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 text-xl">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Head Office</h3>
                  <p className="text-slate-600">Delhi Secretariat, IP Estate<br/>New Delhi - 110002</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Send us a Message</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input type="email" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea rows="4" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="How can we help you?"></textarea>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                Submit Message
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
