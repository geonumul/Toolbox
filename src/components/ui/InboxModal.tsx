import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Mail, ExternalLink, Phone, FileText } from 'lucide-react';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
  onDelete: (id: number) => void;
}

export const InboxModal = ({ isOpen, onClose, applications, onDelete }: InboxModalProps) => {

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
                className="bg-white text-black w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
                        <Mail size={18} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Recruitment Inbox</h2>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                            {applications.length} Applications
                        </p>
                    </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6 space-y-4">
                {applications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                        <Mail size={48} strokeWidth={1} />
                        <p className="text-sm font-light">No applications received yet.</p>
                    </div>
                ) : (
                    applications.map((app) => (
                        <div key={app.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                            <button 
                                onClick={() => onDelete(app.id)}
                                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                                title="Delete Application"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold">{app.name}</h3>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">
                                            {app.date}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mb-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <a href={`mailto:${app.email}`} className="hover:text-black hover:underline flex items-center gap-1">
                                            <Mail size={12} /> {app.email}
                                        </a>
                                        {app.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone size={12} /> {app.phone}
                                            </span>
                                        )}
                                        {app.portfolio && (
                                            <a 
                                                href={app.portfolio} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="flex items-center gap-1 text-blue-600 hover:underline"
                                            >
                                                Portfolio Link <ExternalLink size={12} />
                                            </a>
                                        )}
                                        {app.portfolioFile && (
                                            <a 
                                                href={app.portfolioFile} 
                                                download={`portfolio_${app.name}.pdf`} // Best effort filename
                                                className="flex items-center gap-1 text-green-600 hover:underline"
                                            >
                                                <FileText size={12} /> View Attached File
                                            </a>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-light border border-gray-100">
                                        {app.message}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
