import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

// SHA-256(password + SALT) — never store the plaintext password.
// Brute-forcing requires reverse-engineering the algorithm + salt + iteration
// count, which casual DevTools snooping won't bother with.
const SALT = 'cuk-toolbox-admin-2026';
const ITERATIONS = 50_000;
const EXPECTED_HASH = 'e3addb9c93bc40e6847b7c62e37ad3053ffe5e18e55f76fc6106e0fc3037681b';

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveAdminHash(password: string): Promise<string> {
  // Single SHA-256 of (password + salt), then iterate the hex output to slow
  // any brute-force attempt without making the legitimate login feel slow.
  let current = await sha256Hex(password + SALT);
  for (let i = 0; i < ITERATIONS - 1; i++) {
    current = await sha256Hex(current);
  }
  return current;
}

export const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setVerifying(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    setVerifying(true);
    try {
      const hash = await deriveAdminHash(password);
      if (hash === EXPECTED_HASH) {
        onLoginSuccess();
        onClose();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setVerifying(false);
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
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm"
          >
            <div className="bg-white text-black p-6 md:p-8 rounded-2xl shadow-2xl overflow-hidden relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Lock size={20} className="text-gray-900" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Admin Access</h2>
                <p className="text-gray-500 text-sm mt-1">Enter password to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(false);
                      }}
                      placeholder="Password"
                      className={`w-full px-4 py-3 bg-gray-50 border ${
                        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-black'
                      } rounded-lg outline-none focus:ring-2 transition-all placeholder:text-gray-400`}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-500 text-xs font-medium"
                    >
                      <AlertCircle size={12} />
                      Incorrect password
                    </motion.div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={verifying || !password}
                  className="w-full bg-black text-white py-3 rounded-lg font-bold text-sm tracking-wide uppercase hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
