import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, Search, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Features Bar (Moved from landing page and restyled for dark mode) */}
        <div className="bg-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700 mb-16 shadow-lg shadow-black/20">
          <div className="flex items-center gap-4">
            <div className="text-blue-400 bg-blue-400/10 p-2.5 rounded-full">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-[15px]">Secure & Verified</h4>
              <p className="text-slate-400 text-[13px] font-medium">Your data is safe with us</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-slate-700" />

          <div className="flex items-center gap-4">
            <div className="text-emerald-400 bg-emerald-400/10 p-2.5 rounded-full">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-[15px]">Quick Response</h4>
              <p className="text-slate-400 text-[13px] font-medium">Timely action on complaints</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-slate-700" />

          <div className="flex items-center gap-4">
            <div className="text-amber-400 bg-amber-400/10 p-2.5 rounded-full">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-[15px]">Transparent Process</h4>
              <p className="text-slate-400 text-[13px] font-medium">Track status in real-time</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-slate-700" />

          <div className="flex items-center gap-4">
            <div className="text-purple-400 bg-purple-400/10 p-2.5 rounded-full">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-[15px]">Better Delhi</h4>
              <p className="text-slate-400 text-[13px] font-medium">Building a better tomorrow</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-6">
            <img 
              src="/logo-clean.png" 
              alt="Civic Flow Logo" 
              className="h-14 object-contain brightness-0 invert opacity-90"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden">
              <h2 className="text-2xl font-black text-white tracking-tight">CIVIC FLOW</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              The official platform to report and resolve civic issues across Delhi. Together, let's build a cleaner, safer and better city for all.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-blue-400 transition-colors">Our Services</Link></li>
              <li><Link to="/how-it-works" className="hover:text-blue-400 transition-colors">How It Works</Link></li>
              <li><Link to="/public-dashboard" className="hover:text-blue-400 transition-colors">Track Complaint</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/faqs" className="hover:text-blue-400 transition-colors">FAQs</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Report an Issue</a></li>
            </ul>
          </div>

          {/* Legal & Govt */}
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Citizen Charter</a></li>
              <li>
                <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700 flex items-start gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Govt Logo" className="h-8 opacity-70 brightness-0 invert" />
                  <div className="text-[11px] text-slate-400">
                    <span className="font-bold text-white block mb-0.5">Govt. of NCT of Delhi</span>
                    An official initiative for public grievance redressal.
                  </div>
                </div>
              </li>
            </ul>
          </div>
          
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Civic Flow, Government of NCT of Delhi. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300">Accessibility Statement</a>
            <a href="#" className="hover:text-slate-300">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
