import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PublicHeader } from '../components/layout/PublicHeader';
import { 
  FaTrash, 
  FaTint, 
  FaLightbulb, 
  FaRoad, 
  FaWater, 
  FaTh,
  FaCheckCircle,
  FaFileAlt,
  FaSmile,
  FaSearch,
  FaArrowRight
} from 'react-icons/fa';
import { Footer } from '../components/layout/Footer';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLodgeComplaint = () => {
    if (user) navigate('/submit');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-r from-white via-blue-50/30 to-slate-100 flex-1 flex flex-col justify-center min-h-[600px]">
        
        {/* Background India Gate Image */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 lg:w-[55%] z-0">
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
                <FaFileAlt className="h-4 w-4" />
                Lodge a Complaint
              </button>
              <button 
                onClick={() => navigate('/public-dashboard')}
                className="bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-100 hover:border-blue-200 px-8 py-3.5 rounded-lg font-bold text-[16px] shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <FaSearch className="h-4 w-4" />
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
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <FaCheckCircle className="h-5 w-5" />
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
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <FaFileAlt className="h-5 w-5" />
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
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <FaSmile className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">Happy Citizens</p>
                <p className="text-xl font-black text-slate-800 leading-none">1,95,000+</p>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Categories Section */}
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
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <FaTrash className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Cleanliness</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Garbage, waste<br/>overflow, etc.</p>
              </div>
              <div className="mt-4 flex justify-end text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <FaTint className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Water Supply</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Water leakage,<br/>supply issues, etc.</p>
              </div>
              <div className="mt-4 flex justify-end text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <FaLightbulb className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Street Light</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Broken, flickering<br/>or not working</p>
              </div>
              <div className="mt-4 flex justify-end text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <FaRoad className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Roads & Footpaths</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Potholes, damaged<br/>roads, etc.</p>
              </div>
              <div className="mt-4 flex justify-end text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <FaWater className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Sewage & Drainage</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Blockage, overflow,<br/>bad smell, etc.</p>
              </div>
              <div className="mt-4 flex justify-end text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                  <FaTh className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-[16px] mb-1">Others</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Other civic<br/>related issues</p>
              </div>
              <div className="mt-4 flex justify-end text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
