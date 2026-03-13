import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2 } from 'lucide-react';
import { EditableField } from '../ui/EditableField';
import { useLang } from '../../contexts/LangContext';

interface ArchivePageProps {
    data: any[];
    updateData?: (section: string, newData: any) => void;
    isEditing?: boolean;
}

export const ArchivePage = ({ data, updateData, isEditing = false }: ArchivePageProps) => {
  const { t } = useLang();
  const ITEMS_PER_LOAD = 5;
  const [awardsCount, setAwardsCount] = useState(ITEMS_PER_LOAD);
  const [pubsCount, setPubsCount] = useState(ITEMS_PER_LOAD);

  const awards = data.filter(item => item.type === 'Award');
  const publications = data.filter(item => item.type === 'Publication' || item.type === 'Paper');

  const visibleAwards = awards.slice(0, awardsCount);
  const visiblePubs = publications.slice(0, pubsCount);

  // Handlers
  const handleLoadMoreAwards = () => setAwardsCount(prev => Math.min(prev + ITEMS_PER_LOAD, awards.length));
  const handleShowLessAwards = () => setAwardsCount(ITEMS_PER_LOAD);
  
  const handleLoadMorePubs = () => setPubsCount(prev => Math.min(prev + ITEMS_PER_LOAD, publications.length));
  const handleShowLessPubs = () => setPubsCount(ITEMS_PER_LOAD);

  const handleUpdateItem = (id: number, field: string, value: string) => {
      if (!updateData) return;
      const updated = data.map(item => item.id === id ? { ...item, [field]: value } : item);
      updateData('archive', updated);
  };

  const handleDeleteItem = (id: number) => {
      if (!updateData) return;
      if (window.confirm("Delete this item?")) {
          updateData('archive', data.filter(item => item.id !== id));
      }
  };

  const handleAddItem = (type: 'Award' | 'Publication') => {
      if (!updateData) return;
      const newId = Math.max(0, ...data.map(d => d.id)) + 1;
      const newItem = {
          id: newId,
          type: type,
          year: new Date().getFullYear().toString(),
          title: "New Item Title",
          issuer: type === 'Award' ? "Issuer Name" : undefined,
          author: type === 'Publication' ? "Author Name" : undefined,
      };
      // Add to beginning
      updateData('archive', [newItem, ...data]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-40 px-6 pb-32 bg-white text-black"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-32">
             <h1 className="text-6xl md:text-7xl font-light tracking-tight mb-6">{t.archive.title}</h1>
             <p className="text-gray-500 font-light text-lg tracking-wide">
                {t.archive.description}
             </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-16">
            {/* Awards Column */}
            <div>
                <div className="flex justify-between items-end mb-6 border-b border-black pb-4">
                    <h2 className="text-2xl font-normal">{t.archive.awards}</h2>
                    {isEditing && (
                        <button
                            onClick={() => handleAddItem('Award')}
                            className="text-sm font-medium flex items-center gap-1 hover:text-gray-600 transition-colors"
                        >
                            <Plus size={16} /> {t.archive.add}
                        </button>
                    )}
                </div>
                
                <div className="flex flex-col">
                    {visibleAwards.map((item) => (
                        <div key={item.id} className="py-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-start hover:bg-gray-50/50 transition-colors -mx-4 px-4 group relative">
                            {isEditing && (
                                <button 
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="absolute right-2 top-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <div className="flex items-baseline gap-4 md:gap-12 flex-1 mb-2 md:mb-0">
                                <span className="text-sm text-gray-300 font-light min-w-[3rem]">
                                    <EditableField 
                                        value={item.year}
                                        onSave={(val) => handleUpdateItem(item.id, 'year', val)}
                                        isEditing={isEditing}
                                    />
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-lg font-normal text-gray-900">
                                        <EditableField 
                                            value={item.title}
                                            onSave={(val) => handleUpdateItem(item.id, 'title', val)}
                                            isEditing={isEditing}
                                        />
                                    </span>
                                    {/* Mobile: Issuer on second line */}
                                    <span className="md:hidden text-xs text-gray-400 font-light mt-1">
                                        <EditableField 
                                            value={item.issuer || ""}
                                            onSave={(val) => handleUpdateItem(item.id, 'issuer', val)}
                                            isEditing={isEditing}
                                        />
                                    </span>
                                </div>
                            </div>
                            
                            {/* Desktop: Issuer on right */}
                            <span className="hidden md:block text-sm text-gray-400 text-right font-light ml-4 mt-1 shrink-0 min-w-[100px]">
                                <EditableField 
                                    value={item.issuer || ""}
                                    onSave={(val) => handleUpdateItem(item.id, 'issuer', val)}
                                    isEditing={isEditing}
                                />
                            </span>
                        </div>
                    ))}
                    {visibleAwards.length === 0 && (
                        <div className="py-6 text-gray-400 italic text-sm">{t.archive.noAwards}</div>
                    )}
                </div>

                {/* Buttons for Awards */}
                <div className="mt-10 text-center space-x-6">
                    {awardsCount < awards.length && (
                        <button
                            onClick={handleLoadMoreAwards}
                            className="text-[11px] font-bold tracking-[0.2em] text-gray-400 hover:text-black uppercase transition-colors"
                        >
                            {t.archive.loadMore}
                        </button>
                    )}
                    {awardsCount > ITEMS_PER_LOAD && (
                        <button
                            onClick={handleShowLessAwards}
                            className="text-[11px] font-bold tracking-[0.2em] text-gray-400 hover:text-black uppercase transition-colors"
                        >
                            {t.archive.showLess}
                        </button>
                    )}
                </div>
            </div>

            {/* Publications Column */}
            <div>
                <div className="flex justify-between items-end mb-6 border-b border-black pb-4">
                    <h2 className="text-2xl font-normal">{t.archive.publications}</h2>
                    {isEditing && (
                        <button
                            onClick={() => handleAddItem('Publication')}
                            className="text-sm font-medium flex items-center gap-1 hover:text-gray-600 transition-colors"
                        >
                            <Plus size={16} /> {t.archive.add}
                        </button>
                    )}
                </div>

                <div className="flex flex-col">
                    {visiblePubs.map((item) => (
                        <div key={item.id} className="py-6 border-b border-gray-100 flex flex-col hover:bg-gray-50/50 transition-colors -mx-4 px-4 group relative">
                            {isEditing && (
                                <button 
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="absolute right-2 top-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <div className="flex justify-between items-baseline mb-2 pr-8">
                                <span className="text-lg font-normal text-gray-900 flex-1">
                                    <EditableField 
                                        value={item.title}
                                        onSave={(val) => handleUpdateItem(item.id, 'title', val)}
                                        isEditing={isEditing}
                                    />
                                </span>
                                <span className="text-sm text-gray-300 font-light ml-4">
                                    <EditableField 
                                        value={item.year}
                                        onSave={(val) => handleUpdateItem(item.id, 'year', val)}
                                        isEditing={isEditing}
                                    />
                                </span>
                            </div>
                            <span className="text-sm text-gray-400 font-light">
                                <EditableField 
                                    value={item.author || ""}
                                    onSave={(val) => handleUpdateItem(item.id, 'author', val)}
                                    isEditing={isEditing}
                                />
                            </span>
                        </div>
                    ))}
                    {visiblePubs.length === 0 && (
                        <div className="py-6 text-gray-400 italic text-sm">{t.archive.noPublications}</div>
                    )}
                </div>

                {/* Buttons for Publications */}
                <div className="mt-10 text-center space-x-6">
                    {pubsCount < publications.length && (
                         <button
                            onClick={handleLoadMorePubs}
                            className="text-[11px] font-bold tracking-[0.2em] text-gray-400 hover:text-black uppercase transition-colors"
                        >
                            {t.archive.loadMore}
                        </button>
                    )}
                    {pubsCount > ITEMS_PER_LOAD && (
                         <button
                            onClick={handleShowLessPubs}
                            className="text-[11px] font-bold tracking-[0.2em] text-gray-400 hover:text-black uppercase transition-colors"
                        >
                            {t.archive.showLess}
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
