import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Check, Upload, FileText } from 'lucide-react';

interface JoinUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (application: any) => void;
}

export const JoinUsModal = ({ isOpen, onClose, onApply }: JoinUsModalProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [noPortfolio, setNoPortfolio] = useState(false);
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      portfolio: '',
      portfolioFile: null as string | null, // Blob URL
      message: ''
  });

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onApply) {
        onApply({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            portfolio: noPortfolio ? null : formData.portfolio,
            portfolioFile: formData.portfolioFile,
            message: formData.message
        });
    }

    setIsSubmitted(true);
    
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setNoPortfolio(false);
      setFormData({ name: '', email: '', phone: '', portfolio: '', portfolioFile: null, message: '' });
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setFormData({ ...formData, portfolioFile: url });
      }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white text-black w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl pointer-events-auto relative flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-6 md:p-8 border-b border-gray-100">
                <h2 className="text-3xl font-light tracking-tight">Join Our Team</h2>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                      <Check size={32} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Application Received</h3>
                    <p className="text-gray-500">Thank you for your interest. We'll be in touch shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="border-b border-gray-300 py-2 outline-none focus:border-black transition-colors bg-transparent"
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="border-b border-gray-300 py-2 outline-none focus:border-black transition-colors bg-transparent"
                          placeholder="jane@example.com"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Phone Number</label>
                        <input 
                          type="tel" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="border-b border-gray-300 py-2 outline-none focus:border-black transition-colors bg-transparent"
                          placeholder="010-0000-0000"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center justify-between">
                          <span>Portfolio</span>
                          <span className="text-[10px] text-gray-400 font-normal normal-case">Link OR File Attachment</span>
                      </label>
                      
                      <div className="flex flex-col gap-3">
                        {/* URL Input */}
                        <div className={`relative transition-opacity ${formData.portfolioFile ? 'opacity-50 pointer-events-none' : ''}`}>
                             <input 
                                type="url" 
                                required={!noPortfolio && !formData.portfolioFile}
                                disabled={noPortfolio || !!formData.portfolioFile}
                                value={formData.portfolio}
                                onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
                                className={`w-full border-b border-gray-300 py-2 outline-none transition-colors bg-transparent ${
                                noPortfolio ? 'opacity-50 cursor-not-allowed' : 'focus:border-black'
                                }`}
                                placeholder={noPortfolio ? 'No portfolio' : 'https://your-portfolio.com'}
                            />
                        </div>

                        {/* File Input */}
                        <div className={`flex items-center gap-3 ${formData.portfolio ? 'opacity-50 pointer-events-none' : ''} ${noPortfolio ? 'opacity-50 pointer-events-none' : ''}`}>
                             <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg text-xs font-bold uppercase cursor-pointer transition-colors">
                                <Upload size={14} />
                                {formData.portfolioFile ? 'Change File' : 'Upload File'}
                                <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx" 
                                    className="hidden" 
                                    onChange={handleFileUpload}
                                />
                             </label>
                             {formData.portfolioFile && (
                                 <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                     <Check size={12} /> File Attached
                                 </span>
                             )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          id="no-portfolio"
                          checked={noPortfolio}
                          onChange={(e) => {
                              setNoPortfolio(e.target.checked);
                              if(e.target.checked) {
                                  setFormData({...formData, portfolio: '', portfolioFile: null});
                              }
                          }}
                          className="w-4 h-4 accent-black cursor-pointer"
                        />
                        <label htmlFor="no-portfolio" className="text-sm text-gray-500 cursor-pointer select-none">
                          I don't have a portfolio
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Message</label>
                      <textarea 
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="border border-gray-200 rounded-xl p-4 outline-none focus:border-black transition-colors bg-gray-50 resize-none"
                        placeholder="Tell us about yourself and why you want to join..."
                      />
                    </div>

                    <button 
                      type="submit"
                      className="bg-black text-white py-4 rounded-xl font-bold tracking-wide mt-4 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group"
                    >
                      Submit Application
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
