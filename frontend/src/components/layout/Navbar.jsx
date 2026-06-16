import React, { useState, useEffect } from 'react';
import { Bell, Menu, Search, Database } from 'lucide-react';
import { Input } from '../ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogoutModal } from '../ui/LogoutModal';

export function Navbar({ onMenuClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dbMode, setDbMode] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setDbMode(d.dbMode || null))
      .catch(() => setDbMode(null));
  }, []);

  // Real notifications only — start empty, will be populated from backend events
  const notifications = [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notifications panel when clicking outside
  useEffect(() => {
    if (!showNotifications) return;
    const handle = (e) => {
      if (!e.target.closest('#notification-panel') && !e.target.closest('#notification-bell')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showNotifications]);

  return (
    <>
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />

      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 flex-shrink-0">
        <div className="flex flex-1 items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-slate-500 hover:text-slate-700 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="w-full max-w-md hidden sm:block">
            <Input
              placeholder="Search complaints..."
              icon={<Search className="h-4 w-4" />}
              className="bg-slate-50 border-transparent focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* DB Mode badge */}
          {dbMode === 'local_file' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title="MongoDB Atlas unreachable — data is saved locally on disk">
              <Database className="h-3 w-3" />
              Local Mode
            </div>
          )}
          {dbMode === 'atlas' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="h-3 w-3" />
              Atlas Live
            </div>
          )}

          <div className="hidden sm:block text-slate-700 text-sm font-medium">
            Welcome, {user?.name || user?.displayName || 'Citizen'}
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors hidden sm:block"
          >
            Logout
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              id="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors focus:ring-2 focus:ring-blue-500 rounded-full"
            >
              {/* Only show red dot when there are real unread notifications */}
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
              <Bell className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  id="notification-panel"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                    {unreadCount > 0 ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} New
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No new alerts</span>
                    )}
                  </div>

                  {/* Body */}
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Bell className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        You'll be notified here when there are updates on your complaints.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.map(note => (
                        <div
                          key={note.id}
                          className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!note.read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className="mt-1 flex-shrink-0">
                            <div className={`h-2 w-2 rounded-full mt-1.5 ${!note.read ? 'bg-blue-500' : 'bg-slate-200'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{note.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{note.message}</p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{note.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {notifications.length > 0 && (
                    <div className="px-4 py-2 text-center border-t border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                      <span className="text-xs font-semibold text-blue-600">Mark all as read</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
}
