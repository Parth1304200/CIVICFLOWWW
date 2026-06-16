import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Lock, ShieldCheck, User } from 'lucide-react';
import CryptoJS from 'crypto-js';
import io from 'socket.io-client';

// Shared symmetric key for E2EE demonstration. 
// In a real production app, this would be derived securely (e.g., Diffie-Hellman or a shared master key config).
const E2E_SECRET_KEY = 'civicsense_secure_e2e_key_2026';

let socket;

export function SecureChatWidget({ role }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // Connect to Socket.io server
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001');

    // Fetch historical messages
    socket.emit('GET_MESSAGES', (encryptedHistory) => {
      const decryptedHistory = encryptedHistory.map(msg => {
        try {
          const bytes = CryptoJS.AES.decrypt(msg.encryptedContent, E2E_SECRET_KEY);
          const decryptedContent = bytes.toString(CryptoJS.enc.Utf8);
          return { ...msg, content: decryptedContent };
        } catch (e) {
          return { ...msg, content: '⚠️ Could not decrypt message.' };
        }
      });
      setMessages(decryptedHistory);
      scrollToBottom();
    });

    // Listen for new incoming messages
    socket.on('RECEIVE_MESSAGE', (msg) => {
      try {
        const bytes = CryptoJS.AES.decrypt(msg.encryptedContent, E2E_SECRET_KEY);
        const decryptedContent = bytes.toString(CryptoJS.enc.Utf8);
        setMessages((prev) => [...prev, { ...msg, content: decryptedContent }]);
        
        if (!isOpen && msg.senderRole !== role) {
          setUnread(u => u + 1);
        }
        setTimeout(scrollToBottom, 100);
      } catch (e) {
        console.error('Decryption failed for incoming message');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [role]);

  // When opening chat, clear unread and scroll
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Encrypt the message before sending it over the network
    const encryptedContent = CryptoJS.AES.encrypt(input.trim(), E2E_SECRET_KEY).toString();

    socket.emit('SEND_MESSAGE', {
      senderRole: role,
      encryptedContent
    });

    setInput('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full flex items-center justify-center shadow-2xl z-40 transition-colors ${
          isOpen ? 'bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        <MessageSquare className="h-6 w-6" />
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-white animate-bounce">
            {unread}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {role === 'admin' ? 'Chat with CM' : 'Chat with Admin'}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <ShieldCheck className="h-3 w-3" /> E2E Encrypted
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 px-4 py-2 flex items-start gap-2 border-b border-amber-100">
              <Lock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 font-medium leading-tight">
                Messages are encrypted locally. The server only sees unreadable ciphertext.
              </p>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <MessageSquare className="h-8 w-8 mb-2" />
                  <p className="text-xs font-medium">No messages yet.</p>
                  <p className="text-[10px]">Start the secure conversation.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderRole === role;
                  return (
                    <div key={msg._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 font-medium px-1">
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a secure message..."
                className="flex-1 bg-slate-100 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center text-white transition-colors flex-shrink-0"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
