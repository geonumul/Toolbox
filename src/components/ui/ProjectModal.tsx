import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Calendar, MapPin, FileText, Download, ArrowRight, Maximize2, Minimize2, ZoomIn, ZoomOut, Image as ImageIcon, Upload, Link as LinkIcon, RefreshCw, Save } from 'lucide-react';
import { uploadFileToCloudinary } from '../../utils/uploadService';
import { EditableField } from './EditableField';

interface ProjectModalProps {
  project: any;
  onClose: () => void;
  isEditing?: boolean;
  teamData?: any[];
  onUpdate?: (field: string, value: any) => void;
  onSave?: () => void;
}

export const ProjectModal = ({ project, onClose, isEditing = false, teamData = [], onUpdate, onSave }: ProjectModalProps) => {
  const [scale, setScale] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Wheel Zoom Listener (Non-passive for prevention)
  useEffect(() => {
      const container = imageContainerRef.current;
      if (!container) return;

      const onWheel = (e: WheelEvent) => {
          if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const delta = e.deltaY * -0.002;
              setScale(prev => Math.min(Math.max(1, prev + delta), 5));
          }
      };

      container.addEventListener('wheel', onWheel, { passive: false });
      return () => container.removeEventListener('wheel', onWheel);
  }, []);

  const handleUpdate = (field: string, value: any) => {
    if (onUpdate) {
      onUpdate(field, value);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string = 'pdfUrl') => {
      const file = e.target.files?.[0];
      if (file && onUpdate) {
          setIsUploading(true);
          try {
              // Upload to Cloudinary immediately
              const url = await uploadFileToCloudinary(file);
              onUpdate(field, url);
          } catch (error) {
              console.error("Upload failed", error);
              alert("File upload failed. Please try again.");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
      });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const resetView = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  };

    // Body Scroll Lock logic
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSaveClick = () => {
      if(onSave) {
          onSave();
          alert("Project changes saved!");
      }
  };

  if (!project) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        layoutId={`project-card-${project.id}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full h-full md:max-w-[95vw] md:h-[90vh] md:rounded-xl shadow-2xl flex flex-col md:flex-row relative overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur text-black rounded-full shadow-sm hover:bg-white transition-all md:hidden"
        >
          <X size={20} />
        </button>

        {/* Left Side: Image Viewer */}
        <div className="w-full h-[50%] md:w-[65%] lg:w-[70%] md:h-full bg-neutral-100 relative overflow-hidden group flex flex-col">
            
            {/* Toolbar */}
            <div className="absolute top-4 left-4 right-16 z-10 flex gap-2 md:right-4 md:left-auto">
                <button 
                    onClick={resetView}
                    className="p-2 bg-white/80 backdrop-blur hover:bg-white text-black rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    title="Reset View"
                >
                    <RefreshCw size={14} /> Reset
                </button>
            </div>
             <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none text-center md:text-left md:top-4 md:left-4 md:right-auto md:bottom-auto">
                 <span className="bg-black/50 text-white px-3 py-1 rounded-full text-[10px] font-medium backdrop-blur-sm">
                    {window.innerWidth < 768 ? 'Pinch to Zoom • Drag to Pan' : 'Use Ctrl+Scroll to Zoom • Drag to Pan'}
                 </span>
             </div>

            {/* Image Container */}
            <div 
                ref={imageContainerRef}
                className={`flex-1 overflow-hidden flex items-center justify-center bg-[#f5f5f5] cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div 
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        transformOrigin: 'center center'
                    }}
                    className="relative"
                >
                    <img 
                        src={project.image} 
                        alt={project.title} 
                        className="max-w-none shadow-xl pointer-events-none select-none"
                        style={{
                             maxWidth: '100%',
                             maxHeight: '80vh',
                         }}
                        draggable={false}
                    />
                </div>
            </div>
            
            {/* Edit Image Overlay */}
            {isEditing && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-gray-200 z-20">
                    <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-2">
                             <ImageIcon size={12} /> Update Project Image / File
                         </label>
                         <div className="flex gap-2">
                            <input 
                                type="text"
                                value={project.image}
                                onChange={(e) => handleUpdate('image', e.target.value)}
                                className="w-full bg-white border border-gray-300 p-2 text-xs rounded shadow-sm focus:border-black outline-none"
                                placeholder="Paste URL here..."
                            />
                            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold uppercase cursor-pointer transition-colors whitespace-nowrap">
                                <Upload size={14} />
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, 'image')}
                                    disabled={isUploading}
                                />
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </label>
                         </div>
                    </div>
                </div>
            )}
        </div>

        {/* Right Side: Project Info */}
        <div className="w-full h-[50%] md:w-[35%] lg:w-[30%] md:h-full bg-white border-t md:border-t-0 md:border-l border-gray-100 flex flex-col relative z-10">
            {/* Close Button (Desktop) */}
            <div className="absolute top-0 right-0 p-4 hidden md:block">
                 <button 
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                {/* Header */}
                <div className="mt-2 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded">
                            <EditableField
                                value={project.type || "Project"}
                                onSave={(val) => handleUpdate('type', val)}
                                isEditing={isEditing}
                            />
                        </span>
                    </div>

                    <h2 className="text-3xl font-black mb-2 tracking-tight leading-tight">
                        <EditableField
                            value={project.title}
                            onSave={(val) => handleUpdate('title', val)}
                            isEditing={isEditing}
                        />
                    </h2>
                    
                    <div className="text-sm font-mono text-gray-500 mb-6">
                        {isEditing ? (
                            <div className="relative">
                                <select
                                    value={project.author || ""}
                                    onChange={(e) => handleUpdate('author', e.target.value.trim())}
                                    className="w-full bg-black/5 outline-none rounded px-2 py-1 -mx-1 border border-transparent focus:border-blue-500/30 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select Author</option>
                                    {teamData && teamData.length > 0 ? (
                                        teamData.map((member: any) => (
                                            <option key={member.id} value={member.name.trim()}>{member.name}</option>
                                        ))
                                    ) : (
                                        // Fallback if no team data
                                        ["Ko Geon", "Park Kyeong-jun", "Yoo Seung-min", "Ryu Hyun-jung", "Yang Hyung-seok", "Kwon Si-hyun", "Kim Ji-eun", "Shim Jung-eun", "Kim Do-kyeong", "Admin"].map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))
                                    )}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">▼</div>
                            </div>
                        ) : (
                            project.author || "Unknown"
                        )}
                    </div>

                     <div className="border-b border-gray-100 pb-6 mb-6">
                        <p className="text-base text-gray-700 font-medium leading-relaxed">
                            <EditableField
                                value={project.description || "No description available."}
                                onSave={(val) => handleUpdate('description', val)}
                                isEditing={isEditing}
                                multiline={true}
                            />
                        </p>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                         <div>
                            <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                                <MapPin size={10} /> Location
                            </h4>
                            <p className="text-xs font-bold text-gray-900">
                                <EditableField
                                    value={project.site || "-"}
                                    onSave={(val) => handleUpdate('site', val)}
                                    isEditing={isEditing}
                                />
                            </p>
                         </div>
                         <div>
                            <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                                <Calendar size={10} /> Date
                            </h4>
                            <p className="text-xs font-bold text-gray-900">
                                <EditableField
                                    value={project.date || "-"}
                                    onSave={(val) => handleUpdate('date', val)}
                                    isEditing={isEditing}
                                />
                            </p>
                         </div>
                    </div>

                    {/* Detail Content */}
                    <div className="mb-8">
                        <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1">
                             <FileText size={10} /> Project Details
                        </h4>
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            <EditableField
                                value={project.detailContent || "Add detailed project description here..."}
                                onSave={(val) => handleUpdate('detailContent', val)}
                                isEditing={isEditing}
                                multiline={true}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
                 {isEditing ? (
                    <div className="flex flex-col gap-3">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase text-gray-400">
                                Attachment (PDF, ZIP, etc)
                            </label>
                            {/* NEW SAVE BUTTON */}
                            <button 
                                onClick={handleSaveClick}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                                <Save size={12} /> Save Changes
                            </button>
                         </div>
                         
                         <div className="flex gap-2">
                             <div className="relative flex-1">
                                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={project.pdfUrl || ''} 
                                    onChange={(e) => handleUpdate('pdfUrl', e.target.value)}
                                    className="w-full bg-white border border-gray-200 pl-9 pr-2 py-2 text-xs outline-none focus:border-black rounded"
                                    placeholder="https://..."
                                />
                             </div>
                             
                             <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold uppercase cursor-pointer transition-colors">
                                <Upload size={14} />
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, 'pdfUrl')}
                                />
                                File
                             </label>
                         </div>
                         <p className="text-[10px] text-gray-400">
                             {project.pdfUrl && project.pdfUrl.startsWith('blob:') ? 'File attached (Session only)' : 'Enter URL or upload any file'}
                         </p>
                    </div>
                ) : (
                    <a 
                        href={project.pdfUrl || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all rounded flex items-center justify-center gap-2 group ${(!project.pdfUrl || project.pdfUrl === '#') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                        <span>Download / View File</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                )}
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
