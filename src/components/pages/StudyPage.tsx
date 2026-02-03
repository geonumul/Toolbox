import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2 } from 'lucide-react';
import { EditableField } from '../ui/EditableField';

interface StudyPageProps {
    data: any[];
    updateData?: (section: string, newData: any) => void;
    isEditing?: boolean;
}

export const StudyPage = ({ data, updateData, isEditing = false }: StudyPageProps) => {
  // Pagination State
  const ITEMS_PER_PAGE = 6;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Handlers
  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, data.length));
  };

  const handleShowLess = () => {
    setVisibleCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateLog = (id: number, field: string, value: string) => {
      if (!updateData) return;
      const updated = data.map(log => log.id === id ? { ...log, [field]: value } : log);
      updateData('study', updated);
  };

  const handleAddLog = () => {
      if (!updateData) return;
      const newId = Math.max(0, ...data.map(d => d.id)) + 1;
      const newLog = {
          id: newId,
          week: `WEEK ${data.length + 1}`,
          date: new Date().toISOString().split('T')[0],
          title: "New Study Log",
          content: "Description of the study session...",
          tags: ["New"]
      };
      // Add to beginning of list
      updateData('study', [newLog, ...data]);
  };

  const handleDeleteLog = (id: number) => {
      if (!updateData) return;
      if (window.confirm("Delete this study log?")) {
          updateData('study', data.filter(d => d.id !== id));
      }
  };

  const visibleData = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;
  const canShowLess = visibleCount > ITEMS_PER_PAGE;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-40 px-6 pb-32 bg-white font-sans text-black"
    >
       <div className="max-w-[1400px] mx-auto">
         {/* Header Section */}
         <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-gray-200">
             <div>
                <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-3">Study Log</h1>
                <p className="text-gray-500 font-light text-base tracking-normal">Weekly records of our design exploration.</p>
             </div>
             
             {/* Action Button - Only for Admin */}
             {isEditing && (
                 <button 
                    onClick={handleAddLog}
                    className="mt-6 md:mt-0 px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> Write Log
                 </button>
             )}
         </div>

         {/* Grid Layout */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence>
                {visibleData.map((log) => (
                    <motion.div 
                        key={log.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="group border border-gray-100 bg-white p-10 hover:border-black transition-colors duration-300 min-h-[240px] flex flex-col items-start relative shadow-sm hover:shadow-none"
                    >
                        {isEditing && (
                            <button 
                                onClick={() => handleDeleteLog(log.id)}
                                className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-2"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        {/* Top Row: Week Label & Date */}
                        <div className="w-full flex justify-between items-start mb-8">
                            <span className="bg-black text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.15em] inline-block">
                                <EditableField 
                                    value={log.week}
                                    onSave={(val) => handleUpdateLog(log.id, 'week', val)}
                                    isEditing={isEditing}
                                    className="bg-transparent text-white"
                                />
                            </span>
                            <span className="text-[11px] text-gray-300 font-mono mt-1">
                                <EditableField 
                                    value={log.date}
                                    onSave={(val) => handleUpdateLog(log.id, 'date', val)}
                                    isEditing={isEditing}
                                    className="text-right"
                                />
                            </span>
                        </div>
                        
                        {/* Content */}
                        <div className="w-full mt-2">
                            <h2 className="text-2xl font-normal mb-4 text-gray-900 leading-tight tracking-tight group-hover:underline decoration-1 underline-offset-4 decoration-black">
                                <EditableField 
                                    value={log.title}
                                    onSave={(val) => handleUpdateLog(log.id, 'title', val)}
                                    isEditing={isEditing}
                                />
                            </h2>
                            <div className="text-[15px] text-gray-500 font-light leading-relaxed tracking-wide w-full">
                                <EditableField 
                                    value={log.content}
                                    onSave={(val) => handleUpdateLog(log.id, 'content', val)}
                                    isEditing={isEditing}
                                    multiline={true}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {data.length === 0 && (
                <div className="col-span-2 text-center py-24 text-gray-300 font-mono text-sm border border-dashed border-gray-200">
                    NO STUDY LOGS RECORDED.
                </div>
            )}
         </div>

         {/* Load More / Show Less Buttons */}
         {(hasMore || canShowLess) && (
            <div className="flex justify-center gap-6 mt-24">
                {hasMore && (
                    <button 
                        onClick={handleLoadMore}
                        className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-colors"
                    >
                        Load More +
                    </button>
                )}
                {canShowLess && (
                    <button 
                        onClick={handleShowLess}
                        className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-colors"
                    >
                        Show Less -
                    </button>
                )}
            </div>
         )}
       </div>
    </motion.div>
  );
};
