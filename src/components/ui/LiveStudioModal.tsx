import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, MessageSquare, Edit2, Save, Lock, ArrowRight } from 'lucide-react';

interface LiveStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveLink: string;
  googleMeetLink?: string;
  slackLink?: string;
  isEditing?: boolean;
  onUpdateLink?: (key: string, link: string) => void;
}

export const LiveStudioModal = ({ 
  isOpen, 
  onClose, 
  liveLink, 
  googleMeetLink = '#', 
  slackLink = '#', 
  isEditing, 
  onUpdateLink 
}: LiveStudioModalProps) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempLink, setTempLink] = useState('');
  
  // Password Protection State
  const [selectedPlatform, setSelectedPlatform] = useState<{key: string, link: string} | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditingKey(null);
      setTempLink('');
      setSelectedPlatform(null);
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        setEditingKey(null);
        setSelectedPlatform(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const startEditing = (key: string, currentVal: string) => {
    setEditingKey(key);
    setTempLink(currentVal);
  };

  const handleSave = () => {
    if (onUpdateLink && editingKey) {
      onUpdateLink(editingKey, tempLink);
    }
    setEditingKey(null);
  };

  // Password Logic
  const handlePlatformClick = (key: string, link: string) => {
      // If editing mode is on, we don't need password logic, we just want to edit or do nothing
      if (isEditing) return;

      setSelectedPlatform({ key, link });
      setPassword('');
      setError(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (password === 'TOOLBOX2025') {
          if (selectedPlatform && selectedPlatform.link && selectedPlatform.link !== '#') {
              window.open(selectedPlatform.link, '_blank');
              onClose(); // Close modal after successful navigation
          } else {
              setError(true); // Link is empty
          }
      } else {
          setError(true);
      }
  };

  // Helper to get static classes instead of dynamic ones to ensure Tailwind inclusion
  const getStyleClasses = (type: 'zoom' | 'meet' | 'slack') => {
    switch(type) {
        case 'zoom':
            return {
                iconBg: 'bg-blue-100',
                iconText: 'text-blue-500',
                border: 'border-blue-400',
                bg: 'bg-blue-50',
                button: 'bg-blue-600 hover:bg-blue-700',
                hoverBorder: 'hover:border-blue-400',
                hoverBg: 'hover:bg-blue-50',
                hoverText: 'group-hover:text-blue-700'
            };
        case 'meet':
            return {
                iconBg: 'bg-green-100',
                iconText: 'text-green-600',
                border: 'border-green-400',
                bg: 'bg-green-50',
                button: 'bg-green-600 hover:bg-green-700',
                hoverBorder: 'hover:border-green-400',
                hoverBg: 'hover:bg-green-50',
                hoverText: 'group-hover:text-green-700'
            };
        case 'slack':
            return {
                iconBg: 'bg-purple-100',
                iconText: 'text-purple-500',
                border: 'border-purple-400',
                bg: 'bg-purple-50',
                button: 'bg-purple-600 hover:bg-purple-700',
                hoverBorder: 'hover:border-purple-400',
                hoverBg: 'hover:bg-purple-50',
                hoverText: 'group-hover:text-purple-700'
            };
    }
  };

  const renderLinkItem = (
    key: string,
    label: string,
    currentLink: string,
    icon: React.ReactNode,
    type: 'zoom' | 'meet' | 'slack'
  ) => {
    const isThisEditing = editingKey === key;
    const styles = getStyleClasses(type);

    return (
      <div className="relative group">
        {isThisEditing ? (
          <div className={`flex items-center gap-2 p-2 border ${styles.border} ${styles.bg} rounded-lg`}>
            <input 
              type="text" 
              value={tempLink}
              onChange={(e) => setTempLink(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              placeholder={`Enter ${label} URL...`}
              autoFocus
            />
            <button 
              onClick={handleSave}
              className={`${styles.button} text-white p-2 rounded transition-colors flex-shrink-0`}
            >
              <Save size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => handlePlatformClick(key, currentLink)}
            className={`w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg ${styles.hoverBorder} ${styles.hoverBg} transition-all group text-left`}
          >
            <div className={`w-10 h-10 ${styles.iconBg} ${styles.iconText} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
               {icon}
            </div>
            <span className={`font-bold text-gray-700 ${styles.hoverText}`}>{label}</span>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                <Lock size={16} />
            </div>
          </button>
        )}

        {/* Edit Button */}
        {isEditing && !isThisEditing && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startEditing(key, currentLink);
            }}
            className="absolute top-1/2 -translate-y-1/2 right-4 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10"
            title={`Edit ${label} Link`}
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-2 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">LIVE STUDIO</h2>
                <p className="text-sm text-gray-500">
                    {selectedPlatform ? 'Enter Password' : 'Select a platform to join.'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-black transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 pt-4">
                <AnimatePresence mode="wait">
                    {selectedPlatform ? (
                         <motion.form
                            key="password-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handlePasswordSubmit}
                            className="flex flex-col gap-4"
                         >
                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedPlatform(null)}
                                    className="hover:underline flex items-center gap-1"
                                >
                                    <ArrowRight className="rotate-180" size={12} /> Back
                                </button>
                                <span className="text-gray-300">|</span>
                                <span>Password Required</span>
                            </div>

                            <div className="relative">
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError(false);
                                    }}
                                    placeholder="Enter access code..."
                                    className={`w-full bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-lg px-4 py-3 outline-none focus:border-black transition-colors`}
                                    autoFocus
                                />
                                {error && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-xs font-bold">
                                        Incorrect
                                    </span>
                                )}
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-black text-white py-3 rounded-lg font-bold tracking-wide hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                Verify & Join <ArrowRight size={16} />
                            </button>
                         </motion.form>
                    ) : (
                        <motion.div
                            key="link-list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-3"
                        >
                            {renderLinkItem(
                                'liveStudioLink',
                                'Zoom',
                                liveLink,
                                <Video size={20} />,
                                'zoom'
                            )}

                            {renderLinkItem(
                                'googleMeetLink',
                                'Google Meet',
                                googleMeetLink,
                                <Video size={20} />,
                                'meet'
                            )}

                            {renderLinkItem(
                                'slackLink',
                                'Slack Huddle',
                                slackLink,
                                <MessageSquare size={20} />,
                                'slack'
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
