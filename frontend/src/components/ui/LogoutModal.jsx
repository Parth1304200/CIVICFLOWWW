import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LogoutModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [step, setStep] = useState(1); // 1 = first confirm, 2 = second confirm
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const handleFinalLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      handleClose();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100"
            >
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Step 1 Header */}
                    <div className="px-6 pt-8 pb-6 text-center relative">
                      <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4 ring-4 ring-red-50">
                        <LogOut className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Log Out?</h3>
                      <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                        Are you sure you want to sign out? You'll need to log in again to access your account.
                      </p>
                    </div>

                    <div className="px-6 pb-6 flex flex-col gap-3">
                      <button
                        onClick={handleFirstConfirm}
                        className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold transition-all duration-150 shadow-sm shadow-red-200"
                      >
                        Yes, Log me out
                      </button>
                      <button
                        onClick={handleClose}
                        className="w-full h-11 rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all duration-150"
                      >
                        Stay signed in
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Step 2 - Final Confirmation */}
                    <div className="px-6 pt-8 pb-4 text-center relative">
                      <button
                        onClick={() => setStep(1)}
                        className="absolute left-4 top-4 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4 ring-4 ring-amber-50">
                        <AlertTriangle className="h-8 w-8 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Are you absolutely sure?</h3>
                      <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                        This is your final confirmation. Any unsaved work will be lost.
                      </p>

                      {/* Step indicator */}
                      <div className="flex justify-center gap-2 mt-4">
                        <div className="h-1.5 w-6 rounded-full bg-slate-200"></div>
                        <div className="h-1.5 w-6 rounded-full bg-red-500"></div>
                      </div>
                    </div>

                    <div className="px-6 pb-6 flex flex-col gap-3 pt-2">
                      <button
                        onClick={handleFinalLogout}
                        disabled={isLoggingOut}
                        className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 text-white text-sm font-semibold transition-all duration-150 shadow-sm shadow-red-200 flex items-center justify-center gap-2"
                      >
                        {isLoggingOut ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Logging out...
                          </>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4" />
                            Confirm Logout
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setStep(1)}
                        className="w-full h-11 rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all duration-150"
                      >
                        No, take me back
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
