import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectModal } from '../ui/ProjectModal';
import { X, Plus, Trash2 } from 'lucide-react';

interface GalleryPageProps {
    data: any[];
    initialTab?: string;
    teamData?: any[];
    updateData?: (key: string, value: any) => void;
    isEditing?: boolean;
}

export const GalleryPage = ({ data, initialTab = 'Projects', teamData = [], updateData, isEditing = false }: GalleryPageProps) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

  // Derived state for the selected project to ensure it's always fresh from data
  const selectedProject = selectedProjectId ? data.find(p => p.id === selectedProjectId) : null;

  // Generate authors list from teamData or fallback
  const authorsList = teamData && teamData.length > 0
    ? teamData.map((m: any) => m.name)
    : ["Ko Geon", "Park Kyeong-jun", "Yoo Seung-min"];

  // Update active tab when prop changes
  useEffect(() => {
    if(initialTab) {
        setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Filter Logic
  const filteredData = data.filter(item => {
      const matchesTab = item.type === activeTab;
      const matchesAuthor = selectedAuthors.length === 0 || (item.author && selectedAuthors.includes(item.author));
      return matchesTab && matchesAuthor;
  });

  const toggleAuthor = (author: string) => {
      if (selectedAuthors.includes(author)) {
          setSelectedAuthors(prev => prev.filter(a => a !== author));
      } else {
          setSelectedAuthors(prev => [...prev, author]);
      }
  };

  const clearAuthors = () => {
      setSelectedAuthors([]);
  };

  // Editing Handlers
  const handleUpdateProject = (id: number, field: string, value: any) => {
    if (!updateData) return;
    const updatedGallery = data.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    updateData('gallery', updatedGallery);
  };

  const handleAddProject = () => {
    if (!updateData) return;
    const newId = Math.max(...data.map(m => m.id), 0) + 1;
    const newProject = {
        id: newId,
        title: "New Project",
        type: activeTab,
        author: "Author Name",
        date: "2026.01.01",
        image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        description: "Project description..."
    };
    updateData('gallery', [...data, newProject]);
  };

  const handleDeleteProject = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      if (!updateData) return;
      if (confirm("Delete this project?")) {
          const updatedGallery = data.filter(item => item.id !== id);
          updateData('gallery', updatedGallery);
      }
  };

  return (
    <div>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen pt-24 md:pt-32 px-4 md:px-6 pb-24"
        >
        <div className="max-w-[1600px] mx-auto">
            
            {/* Top Toggle: Projects / Activities */}
            <div className="flex justify-center mb-8 md:mb-12">
                <div className="inline-flex bg-muted rounded-full p-1 relative w-full max-w-[320px] md:max-w-none md:w-auto">
                    <motion.div 
                        className="absolute top-1 bottom-1 bg-background rounded-full shadow-sm"
                        initial={false}
                        animate={{
                            left: activeTab === 'Projects' ? '4px' : '50%',
                            right: activeTab === 'Projects' ? '50%' : '4px',
                            width: 'calc(50% - 4px)' 
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    
                    {['Projects', 'Activities'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); clearAuthors(); }}
                            className={`relative z-10 flex-1 md:flex-none md:w-40 py-2 text-xs md:text-sm font-bold uppercase tracking-widest transition-colors duration-200 ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Author Filter List - Only show for Projects */}
            <AnimatePresence>
                {activeTab === 'Projects' && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-24 max-w-5xl mx-auto px-4 overflow-hidden"
                    >
                        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 pt-4">
                            <button 
                                onClick={clearAuthors}
                                className={`text-sm font-mono uppercase tracking-tight transition-colors ${selectedAuthors.length === 0 ? 'font-bold text-primary border-b border-primary' : 'text-muted-foreground hover:text-primary'}`}
                            >
                                All Work
                            </button>
                            
                            <span className="text-muted text-xs">|</span>
                            
                            {authorsList.map((author, index) => (
                                <React.Fragment key={author}>
                                    <button
                                        onClick={() => toggleAuthor(author)}
                                        className={`text-sm font-mono uppercase tracking-tight transition-colors ${selectedAuthors.includes(author) ? 'font-bold text-primary border-b border-primary' : 'text-muted-foreground hover:text-primary'}`}
                                    >
                                        {author}
                                    </button>
                                    {(index < authorsList.length - 1) && (
                                        <span className="text-muted text-xs">|</span>
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Clear Button */}
                            <AnimatePresence>
                                {selectedAuthors.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, x: -10 }}
                                        className="inline-flex items-center ml-4"
                                    >
                                        <button
                                            onClick={clearAuthors}
                                            className="group flex items-center gap-1.5 text-[10px] font-mono font-bold text-muted-foreground hover:text-destructive uppercase tracking-widest border border-border hover:border-destructive/20 rounded-full px-3 py-1 transition-all"
                                        >
                                            <X size={10} className="group-hover:rotate-90 transition-transform" />
                                            Clear
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 gap-y-16">
                {filteredData.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }} 
                        className="group cursor-pointer flex flex-col h-full relative"
                        onClick={() => setSelectedProjectId(item.id)}
                    >
                        {/* Delete Button */}
                        {isEditing && (
                            <button 
                                onClick={(e) => handleDeleteProject(e, item.id)}
                                className="absolute top-2 right-2 z-20 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        <div className="overflow-hidden aspect-square bg-muted relative mb-4">
                            <img 
                                src={item.image} 
                                alt={item.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0" 
                            />
                            
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-2 h-2 bg-background rounded-full animate-pulse" />
                            </div>
                        </div>

                        <div className="mt-auto">
                            <h3 className="text-lg font-bold leading-tight group-hover:text-muted-foreground transition-colors mb-1">
                                {item.title}
                            </h3>
                            <div className="flex justify-between items-baseline font-mono text-[10px] text-muted-foreground uppercase tracking-wide">
                                <span>{activeTab === 'Activities' ? (item.author || "Team") : (item.author || "Unknown")}</span>
                                <span>{item.date || "2026.01.01"}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Add Project Card */}
                {isEditing && (
                    <div 
                        onClick={handleAddProject}
                        className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer"
                    >
                         <Plus size={48} strokeWidth={1} />
                         <span className="mt-4 font-bold uppercase tracking-widest text-xs">Add {activeTab}</span>
                    </div>
                )}
            </div>

            {filteredData.length === 0 && !isEditing && (
                <div className="text-center py-32 border-t border-b border-border">
                    <div className="text-4xl font-mono text-muted mb-2">NULL</div>
                    <div className="text-muted-foreground font-mono text-sm">NO DATA FOUND FOR SELECTED FILTERS</div>
                </div>
            )}
        </div>
        </motion.div>
        
        <AnimatePresence>
            {selectedProject && (
                <ProjectModal 
                    project={selectedProject} 
                    onClose={() => setSelectedProjectId(null)} 
                    isEditing={isEditing}
                    onUpdate={(field, val) => handleUpdateProject(selectedProject.id, field, val)}
                />
            )}
        </AnimatePresence>
    </div>
  );
};
