import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Settings, Check, Edit2, LogOut, Mail } from 'lucide-react';
import { LiveStudioModal } from './ui/LiveStudioModal';
import { AdminLoginModal } from './ui/AdminLoginModal';
import { useLang } from '../contexts/LangContext';

interface HeaderProps {
  currentPage: string;
  setPage: (page: string) => void;
  liveLink: string;
  googleMeetLink?: string;
  slackLink?: string;
  toggleEditMode?: () => void;
  isEditing?: boolean;
  updateConfig?: (newConfig: any) => void;
  onOpenInbox?: () => void;
  inboxCount?: number;
}

export const Header = ({ 
    currentPage, 
    setPage, 
    liveLink, 
    googleMeetLink, 
    slackLink, 
    toggleEditMode, 
    isEditing = false, 
    updateConfig,
    onOpenInbox,
    inboxCount = 0
}: HeaderProps) => {
  const { lang, setLang, t } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const menuItems = [
    { label: 'HOME', id: 'home' },
    { label: 'GALLERY', id: 'gallery' },
    { label: 'SCHEDULE', id: 'schedule' },
    { label: 'STUDY', id: 'study' },
    { label: 'TEAM', id: 'team' },
    { label: 'ARCHIVE', id: 'archive' },
  ];

  const handleNav = (id: string) => {
    setPage(id);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleAdminClick = () => {
    setIsOpen(false);
    if (isEditing) {
      if (toggleEditMode) toggleEditMode();
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    if (toggleEditMode) toggleEditMode();
  };

  const handleUpdateLink = (key: string, value: string) => {
    if (updateConfig) {
      updateConfig({ [key]: value });
    }
  };

  return (
    <div>
      <header className="absolute top-0 left-0 right-0 z-50 mix-blend-difference text-white p-4 md:p-10 flex justify-between items-center pointer-events-none">
        {/* Left: Logo (Visible on all pages except HOME) */}
        <div className="pointer-events-auto">
            {currentPage !== 'home' && (
                <button 
                    onClick={() => setPage('home')}
                    className="font-black text-2xl tracking-tighter hover:opacity-70 transition-opacity"
                >
                    TOOLBOX
                </button>
            )}
        </div>

        <div className="pointer-events-auto flex items-center gap-4 md:gap-8">
            {/* Language Toggle */}
            <button
                onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
                className="text-[10px] font-bold tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity"
            >
                {lang === 'ko' ? 'EN' : 'KO'}
            </button>

            {/* Live Studio Button - Opens Modal */}
            <button
                onClick={() => setIsLiveModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-1.5 border border-white/30 rounded-full hover:bg-white hover:text-black transition-all group"
            >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest uppercase">{t.header.liveStudio}</span>
            </button>

            {/* Menu Button */}
            <button
               onClick={() => setIsOpen(true)}
               className="group flex items-center gap-3 hover:opacity-70 transition-opacity"
            >
                <span className="text-sm font-bold tracking-widest uppercase">{t.header.menu}</span>
                <div className="bg-white text-black rounded-full p-1 group-hover:rotate-90 transition-transform">
                    <Menu size={16} />
                </div>
            </button>
        </div>
      </header>

      {/* Admin Controls (Floating) */}
      {isEditing && (
        <div className="fixed top-24 right-6 z-50 pointer-events-auto flex flex-col items-end gap-3">
             {/* Edit Mode Toggle (Now Top) */}
             <button
                onClick={() => toggleEditMode && toggleEditMode()}
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-red-600 transition-colors group cursor-pointer"
             >
                <div className="group-hover:hidden flex items-center gap-2 animate-pulse">
                    <Edit2 size={12} />
                    {t.header.editingMode}
                </div>
                <div className="hidden group-hover:flex items-center gap-2">
                    <LogOut size={12} />
                    {t.header.exitAdmin}
                </div>
             </button>

             {/* Inbox Button (Now Bottom) */}
             <button
                onClick={() => onOpenInbox && onOpenInbox()}
                className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
             >
                <div className="relative">
                    <Mail size={12} />
                    {inboxCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </div>
                {t.header.adminInbox}
             </button>
        </div>
      )}

      {/* Full Screen Menu */}
      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm text-white flex flex-col justify-center items-center"
            >
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-6 right-6 md:top-10 md:right-10 flex items-center gap-3 hover:opacity-70 transition-opacity"
                >
                    <span className="text-sm font-bold tracking-widest uppercase">{t.header.close}</span>
                    <div className="bg-white text-black rounded-full p-1 hover:rotate-90 transition-transform">
                        <X size={16} />
                    </div>
                </button>

                <nav className="flex flex-col gap-4 md:gap-8 text-center">
                    {menuItems.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => handleNav(item.id)}
                            className={`text-5xl md:text-8xl font-black tracking-tighter hover:text-transparent hover:stroke-white hover:stroke-1 transition-all uppercase ${
                                currentPage === item.id ? 'text-white' : 'text-gray-500 hover:text-white'
                            }`}
                            style={{ WebkitTextStroke: '1px transparent' }}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-12 flex flex-col items-center gap-6">
                    <button
                        onClick={() => { setIsOpen(false); setIsLiveModalOpen(true); }}
                        className="md:hidden flex items-center gap-2 px-4 py-2 border border-white/30 rounded-full hover:bg-white hover:text-black transition-all"
                    >
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold tracking-widest uppercase">{t.header.liveStudio}</span>
                    </button>
                </div>

                {toggleEditMode && (
                    <button 
                        onClick={handleAdminClick}
                        className={`absolute bottom-6 right-6 md:bottom-10 md:right-10 text-xs font-mono flex items-center gap-2 uppercase tracking-widest transition-colors ${
                            isEditing ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 hover:text-white'
                        }`}
                    >
                        {isEditing ? (
                            <>
                                <Check size={12} />
                                {t.header.doneEditing}
                            </>
                        ) : (
                            <>
                                <Settings size={12} />
                                {t.header.adminAccess}
                            </>
                        )}
                    </button>
                )}
            </motion.div>
        )}
      </AnimatePresence>

      <LiveStudioModal 
        isOpen={isLiveModalOpen} 
        onClose={() => setIsLiveModalOpen(false)} 
        liveLink={liveLink}
        googleMeetLink={googleMeetLink}
        slackLink={slackLink}
        isEditing={isEditing}
        onUpdateLink={handleUpdateLink}
      />

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};
