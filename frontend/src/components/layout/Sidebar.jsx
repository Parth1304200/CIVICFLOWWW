import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, LogOut, Radio, User, HelpCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { LogoutModal } from '../ui/LogoutModal';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ isOpen, setIsOpen }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useAuth();
  const role = localStorage.getItem('role');
  
  const navItems = role === 'admin' ? [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Hotspot Monitor', path: '/hotspot-dashboard', icon: Radio },
    { name: 'Solved Problems', path: '/solved-problems', icon: CheckCircle2 }
  ] : role === 'cm' ? [
    { name: 'CM Dashboard', path: '/cm-dashboard', icon: LayoutDashboard }
  ] : [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Complaints', path: '/complaints', icon: FileText },
    { name: 'Submit Complaint', path: '/submit', icon: PlusCircle },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Help & Support', path: '/help', icon: HelpCircle },
  ];

  return (
    <>
      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[1040] bg-black/50 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[1050] w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <img 
              src="/logo-clean.png" 
              alt="Civic Flow Logo" 
              className="h-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              C
            </div>
            CivicFlow
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {user?.photo ? (
                <img 
                  src={user.photo.startsWith('http') ? user.photo : `http://localhost:5001${user.photo}`} 
                  alt="Profile" 
                  className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600 uppercase">
                  {user?.name ? user.name.charAt(0) : (user?.displayName ? user.displayName.charAt(0) : 'U')}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate w-28">{user?.name || user?.displayName || 'Citizen'}</span>
                <span className="text-xs text-slate-500 capitalize">{user?.role || 'Citizen'}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
