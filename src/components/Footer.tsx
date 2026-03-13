import React, { useState } from 'react';
import { Instagram, ArrowUp, Box, Edit2, Check, X } from 'lucide-react';
import { JoinUsModal } from './ui/JoinUsModal';
import { useLang } from '../contexts/LangContext';

interface FooterProps {
  isEditing?: boolean;
  onUpdateConfig?: (key: string, value: string) => void;
  config?: any;
  onApply?: (application: any) => void;
}

export const Footer = ({ isEditing, onUpdateConfig, config, onApply }: FooterProps) => {
  const { t } = useLang();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const saveEdit = () => {
    if (onUpdateConfig && editingField) {
      onUpdateConfig(editingField, tempValue);
    }
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  // Helper to render editable link
  const renderEditableLink = (
    fieldKey: string, 
    currentLink: string, 
    label: string, 
    icon: React.ReactNode
  ) => {
    const isThisFieldEditing = editingField === fieldKey;

    if (isThisFieldEditing) {
      return (
        <div className="flex items-center gap-2">
           <input 
             type="text"
             value={tempValue}
             onChange={(e) => setTempValue(e.target.value)}
             className="bg-gray-800 text-white px-2 py-1 rounded text-xs w-32 outline-none border border-gray-600 focus:border-white transition-colors"
             autoFocus
           />
           <button onClick={saveEdit} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
           <button onClick={cancelEdit} className="text-red-400 hover:text-red-300"><X size={14} /></button>
        </div>
      );
    }

    return (
      <div className="relative group/edit flex items-center gap-2">
        <a 
          href={currentLink || '#'} 
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors flex items-center gap-2"
          onClick={(e) => isEditing && e.preventDefault()}
        >
            {icon} {label}
        </a>
        {isEditing && (
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    startEditing(fieldKey, currentLink || '#');
                }}
                className="opacity-0 group-hover/edit:opacity-100 text-gray-500 hover:text-white transition-opacity ml-2"
            >
                <Edit2 size={12} />
            </button>
        )}
      </div>
    );
  };

  // Helper to render editable text (email/phone)
  const renderEditableText = (
      fieldKey: string,
      currentValue: string,
      isLink: boolean = false
  ) => {
      const isThisFieldEditing = editingField === fieldKey;

      if (isThisFieldEditing) {
          return (
            <div className="flex items-center gap-2">
               <input 
                 type="text"
                 value={tempValue}
                 onChange={(e) => setTempValue(e.target.value)}
                 className="bg-gray-800 text-white px-2 py-1 rounded text-xs w-48 outline-none border border-gray-600 focus:border-white transition-colors"
                 autoFocus
               />
               <button onClick={saveEdit} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
               <button onClick={cancelEdit} className="text-red-400 hover:text-red-300"><X size={14} /></button>
            </div>
          );
      }

      return (
          <div className="relative group/edit flex items-center gap-2">
              {isLink ? (
                  <a href={`mailto:${currentValue}`} className="hover:text-white transition-colors">
                      {currentValue}
                  </a>
              ) : (
                  <span className="text-gray-400">{currentValue}</span>
              )}
              {isEditing && (
                <button 
                    onClick={() => startEditing(fieldKey, currentValue)}
                    className="opacity-0 group-hover/edit:opacity-100 text-gray-500 hover:text-white transition-opacity ml-2"
                >
                    <Edit2 size={12} />
                </button>
            )}
          </div>
      );
  };

  return (
    <>
      <footer className="bg-white pt-16 md:pt-24 relative z-10 w-full">
        {/* Full width container, no side/bottom margin, only top rounded corners */}
        <div className="bg-black text-white rounded-t-[2.5rem] md:rounded-t-[4rem] px-4 md:px-20 pt-16 md:pt-32 pb-8 md:pb-12 w-full relative overflow-hidden">
           
           {/* Main Content */}
           <div className="flex flex-col md:flex-row justify-between items-start mb-20 md:mb-32 max-w-[1800px] mx-auto w-full">
               {/* Left Section */}
               <div className="max-w-2xl mb-12 md:mb-0">
                   <h2 className="text-4xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[1.1] mb-8 md:mb-12">
                       {t.footer.line1}<br/>
                       {t.footer.line2}<br/>
                       {t.footer.line3}
                   </h2>
                   <button
                      onClick={() => setIsJoinModalOpen(true)}
                      className="bg-white text-black px-10 py-4 rounded-full text-sm font-bold tracking-wide hover:bg-gray-200 transition-colors"
                   >
                       {t.footer.joinUs}
                   </button>
               </div>
  
               {/* Right Section - Columns */}
               <div className="flex gap-16 md:gap-32 text-sm self-start md:self-start md:mt-4">
                   <div className="flex flex-col gap-6">
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t.footer.socials}</span>
                       <div className="flex flex-col gap-3 font-light text-gray-300">
                          {renderEditableLink(
                            'instagramLink', 
                            config?.instagramLink, 
                            'Instagram', 
                            <Instagram size={16} />
                          )}
                          {renderEditableLink(
                            'notionLink', 
                            config?.notionLink, 
                            'Notion', 
                            <Box size={16} strokeWidth={2} />
                          )}
                       </div>
                   </div>
                   <div className="flex flex-col gap-6">
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t.footer.contact}</span>
                       <div className="flex flex-col gap-3 font-light text-gray-300">
                          {renderEditableText(
                              'contactEmail',
                              config?.contactEmail || '8268go@Naver.com',
                              true
                           )}
                          {renderEditableText(
                              'contactPhone',
                              config?.contactPhone || '+82 10-4948-8268',
                              false
                           )}
                       </div>
                   </div>
               </div>
           </div>
  
           {/* Bottom Section - Divider & Copyright */}
           <div className="max-w-[1800px] mx-auto w-full">
              <div className="h-px w-full bg-gray-800 mb-8" />
              
              <div className="flex justify-between items-center">
                  <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">
                      © 2025 TOOLBOX. ALL RIGHTS RESERVED.
                  </span>
  
                  <button 
                      onClick={scrollToTop}
                      className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black transition-all"
                  >
                      <ArrowUp size={16} />
                  </button>
              </div>
           </div>
        </div>
      </footer>

      <JoinUsModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        onApply={onApply}
      />
    </>
  );
};
