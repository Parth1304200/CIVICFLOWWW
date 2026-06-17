import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ChevronDown } from 'lucide-react';

export function PublicHeader() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAuthNavigation = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'cm') navigate('/cm-dashboard');
      else navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      {/* Scrolling News Ticker */}
      <div className="bg-blue-700 text-white text-xs font-medium py-1.5 px-4 overflow-hidden shadow-inner relative z-[60]">
        <div className="max-w-[1400px] mx-auto flex items-center">
          <span className="bg-red-600 text-white px-2 py-0.5 rounded-sm mr-3 font-bold uppercase shrink-0 animate-pulse">Update</span>
          <marquee scrollamount="5" className="flex-1 text-blue-50 font-medium tracking-wide">
            Welcome to Civic Flow - The official portal to report and resolve civic issues across Delhi. Important: New guidelines for water supply complaints have been updated. Ensure faster resolution by providing clear photos of the issue.
          </marquee>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo / Govt branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="Govt Logo" 
              className="h-10 w-auto opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <div className="flex flex-col">
              <span className="font-bold text-[15px] leading-tight text-slate-900 group-hover:text-blue-700 transition-colors">Govt. of NCT of Delhi</span>
              <span className="text-[13px] font-medium text-slate-600">दिल्ली सरकार</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">Home</Link>
            <Link to="/about" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">About</Link>
            <Link to="/services" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">Services</Link>
            <Link to="/how-it-works" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">How It Works</Link>
            <Link to="/public-dashboard" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">Track Complaint</Link>
            <Link to="/faqs" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">FAQs</Link>
            <Link to="/contact" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">Contact</Link>
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="flex items-center gap-1 text-slate-600 font-medium text-[14px] hover:text-slate-900 px-3 py-2 rounded-md border border-slate-200 transition-colors">
              English <ChevronDown className="h-4 w-4" />
            </button>
            <button 
              onClick={handleAuthNavigation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-[15px] shadow-sm transition-colors"
            >
              {user ? 'Dashboard' : 'Login / Sign Up'}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0">
            <nav className="flex flex-col py-2 px-4 space-y-1">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-semibold rounded-lg transition-colors">Home</Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-semibold rounded-lg transition-colors">About</Link>
              <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-semibold rounded-lg transition-colors">Services</Link>
              <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-semibold rounded-lg transition-colors">How It Works</Link>
              <Link to="/public-dashboard" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-semibold rounded-lg transition-colors">Track Complaint</Link>
              <Link to="/faqs" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-semibold rounded-lg transition-colors">FAQs</Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-semibold rounded-lg transition-colors">Contact</Link>
              
              <div className="border-t border-slate-100 my-2 pt-2 pb-2">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleAuthNavigation();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-center transition-colors shadow-sm"
                >
                  {user ? 'Go to Dashboard' : 'Login / Sign Up'}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
