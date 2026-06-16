import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronDown,
  Trash2, 
  Droplet, 
  Lightbulb, 
  Route, 
  Waves, 
  LayoutGrid,
  CheckCircle2,
  FileText,
  Smile,
  ShieldCheck,
  Clock,
  Search,
  ArrowRight
} from 'lucide-react';
import { Footer } from '../components/layout/Footer';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAuthNavigation = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin-dashboard');
      else if (user.role === 'cm') navigate('/cm-dashboard');
      else navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleLodgeComplaint = () => {
    if (user) navigate('/submit-complaint');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo / Govt branding */}
          <div className="flex items-center gap-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="Govt Logo" 
              className="h-10 w-auto opacity-90"
            />
            <div className="flex flex-col">
              <span className="font-bold text-[15px] leading-tight text-slate-900">Govt. of NCT of Delhi</span>
              <span className="text-[13px] font-medium text-slate-600">दिल्ली सरकार</span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-blue-600 font-bold text-[15px] border-b-2 border-blue-600 pb-1">Home</Link>
            <Link to="/about" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">About</Link>
            <Link to="/services" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">Services</Link>
            <Link to="/how-it-works" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">How It Works</Link>
            <Link to="/public-dashboard" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">Track Complaint</Link>
            <Link to="/faqs" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">FAQs</Link>
            <Link to="/contact" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">Contact</Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-1 text-slate-600 font-medium text-[14px] hover:text-slate-900 px-3 py-2 rounded-md border border-slate-200">
              English <ChevronDown className="h-4 w-4" />
            </button>
            <button 
              onClick={handleAuthNavigation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-[15px] shadow-sm transition-colors"
            >
              {user ? 'Dashboard' : 'Login / Sign Up'}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-r from-white via-blue-50/30 to-slate-100 flex-1 flex flex-col justify-center min-h-[600px]">
        
        {/* Background India Gate Image */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 lg:w-[55%] z-0">
          {/* A gradient mask to fade the image into the white background on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2070&auto=format&fit=crop" 
            alt="India Gate" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 py-16">
          
          {/* Left Content */}
          <div className="flex flex-col justify-center max-w-xl">
            <div className="inline-flex items-center justify-center bg-blue-50 text-blue-600 text-[13px] font-bold px-4 py-1.5 rounded-full mb-8 w-max border border-blue-100">
              Official Civic Complaint Platform
            </div>

            {/* Custom Logo Image (Using uploaded test image or fallback text) */}
            <div className="mb-6">
              <img 
                src="/logo.png" 
                alt="Civic Flow Logo" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
                className="h-24 md:h-32 object-contain"
              />
              {/* Fallback if logo.png is missing */}
              <div className="hidden">
                <h1 className="text-6xl md:text-7xl font-black tracking-tight text-slate-900 mb-2">
                  CIVIC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">FLOW</span>
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2">
                  Your Voice. Our Action. Better Delhi.
                </h2>
              </div>
            </div>

            <p className="text-[17px] leading-relaxed text-slate-600 mb-10 max-w-lg font-medium">
              Civic Flow is the official platform to report and resolve civic
              issues across Delhi. Together, let's build a cleaner, safer
              and better city for all.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleLodgeComplaint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg font-bold text-[16px] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Lodge a Complaint
              </button>
              <button 
                onClick={() => navigate('/public-dashboard')}
                className="bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-100 hover:border-blue-200 px-8 py-3.5 rounded-lg font-bold text-[16px] shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" />
                Track Complaint
              </button>
            </div>
          </div>

          {/* Right Content - Floating Stats */}
          <div className="hidden lg:flex flex-col absolute bottom-12 right-12 gap-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-xl border border-white flex items-center gap-4 w-[240px] ml-auto"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">Complaints Resolved</p>
                <p className="text-xl font-black text-slate-800 leading-none">2,45,678+</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-xl border border-white flex items-center gap-4 w-[240px] ml-auto relative right-8"
            >
              <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">Active Complaints</p>
                <p className="text-xl font-black text-slate-800 leading-none">18,342+</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-xl border border-white flex items-center gap-4 w-[240px] ml-auto"
            >
              <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                <Smile className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">Happy Citizens</p>
                <p className="text-xl font-black text-slate-800 leading-none">1,95,000+</p>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 3. Categories Section */}
      <section className="bg-slate-50 py-20 px-6 border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-800 mb-3">Report. Resolve. Transform Delhi.</h2>
          <p className="text-slate-500 font-medium text-[16px] mb-12">
            Raise complaints quickly and help us improve public services in your area.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Cleanliness</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Garbage, waste<br/>overflow, etc.</p>
              </div>
              <div className="mt-4 flex justify-end text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                  <Droplet className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Water Supply</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Water leakage,<br/>supply issues, etc.</p>
              </div>
              <div className="mt-4 flex justify-end text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Street Light</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Broken, flickering<br/>or not working</p>
              </div>
              <div className="mt-4 flex justify-end text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-4">
                  <Route className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Roads & Footpaths</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Potholes, damaged<br/>roads, etc.</p>
              </div>
              <div className="mt-4 flex justify-end text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center mb-4">
                  <Waves className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Sewage & Drainage</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Blockage, overflow,<br/>bad smell, etc.</p>
              </div>
              <div className="mt-4 flex justify-end text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center mb-4">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Others</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Other civic<br/>related issues</p>
              </div>
              <div className="mt-4 flex justify-end text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
