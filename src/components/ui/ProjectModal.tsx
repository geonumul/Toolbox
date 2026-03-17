import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Calendar, MapPin, FileText, Download, ArrowRight, Image as ImageIcon, Upload, Link as LinkIcon, Save, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { uploadFileToCloudinary } from '../../utils/uploadService';
import { EditableField } from './EditableField';

interface ProjectModalProps {
  project: any;
  onClose: () => void;
  isEditing?: boolean;
  teamData?: any[];
  onUpdate?: (field: string | object, value?: any) => void;
  onSave?: () => void;
  onAutoSave?: (updates: Record<string, any>) => void;
}

export const ProjectModal = ({ project, onClose, isEditing = false, teamData = [], onUpdate, onSave, onAutoSave }: ProjectModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imageList: string[] = (project.images && project.images.length > 0)
    ? project.images
    : (project.image ? [project.image] : []);

  const currentImage = imageList[currentImageIndex] ?? '';

  useEffect(() => { setCurrentImageIndex(0); }, [project.id]);

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

  const handleUpdate = (field: string, value: any) => {
    if (onUpdate) {
        // SYNC LOGIC for Text Inputs
        if (field === 'image') {
            // If image is updated, also update pdfUrl (Attachment) to match
            onUpdate({
                image: value,
                pdfUrl: value
            });
        } else if (field === 'pdfUrl') {
            // If pdfUrl is updated, also update image ONLY if it looks like an image URL
            // (checking common extensions or raw blob/data uri, or simply trusting user intent as requested)
            // The user said: "If I put a link on the right, left and right links should appear together"
            // So we will sync it back to image as well.
            onUpdate({
                pdfUrl: value,
                image: value
            });
        } else {
            // Normal update for other fields
            onUpdate(field, value);
        }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string = 'pdfUrl') => {
      const file = e.target.files?.[0];
      if (file && onUpdate) {
          setIsUploading(true);
          setUploadProgress(0);
          try {
              const url = await uploadFileToCloudinary(file, setUploadProgress);
              
              if (field === 'image') {
                  const updates = { image: url, pdfUrl: url };
                  onUpdate(updates);
                  if (onAutoSave) onAutoSave(updates);
              } else {
                  if (file.type.startsWith('image/')) {
                      const updates = { image: url, pdfUrl: url };
                      onUpdate(updates);
                      if (onAutoSave) onAutoSave(updates);
                  } else {
                      onUpdate('pdfUrl', url);
                      if (onAutoSave) onAutoSave({ pdfUrl: url });
                  }
              }

          } catch (error) {
              console.error("Upload failed", error);
              alert("File upload failed. Please try again.");
          } finally {
              setIsUploading(false);
              setUploadProgress(0);
          }
      }
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpdate) return;
    if (imageList.length >= 10) { alert("최대 10장까지 업로드할 수 있습니다."); return; }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadFileToCloudinary(file, setUploadProgress);
      const newImages = [...imageList, url];
      const updates = { images: newImages, image: newImages[0], pdfUrl: newImages[0] };
      onUpdate(updates);
      if (onAutoSave) onAutoSave(updates);
      setCurrentImageIndex(newImages.length - 1);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = imageList.filter((_, i) => i !== index);
    const updates = newImages.length > 0
      ? { images: newImages, image: newImages[0], pdfUrl: newImages[0] }
      : { images: [], image: '', pdfUrl: '' };
    onUpdate?.(updates);
    if (onAutoSave) onAutoSave(updates);
    setCurrentImageIndex(Math.min(currentImageIndex, Math.max(0, newImages.length - 1)));
  };

    // Body Scroll Lock logic
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSaveClick = () => {
      if (project.type !== 'Activities' && !project.author?.trim()) {
          alert("Please select an author before saving.");
          return;
      }
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        layoutId={`project-card-${project.id}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full h-full md:w-[980px] md:h-[620px] md:rounded-xl shadow-2xl flex flex-col md:flex-row relative overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur text-black rounded-full shadow-sm hover:bg-white transition-all md:hidden"
        >
          <X size={20} />
        </button>

        {/* Left Side: Image Viewer */}
        <div className="w-full h-[55%] md:w-[62%] md:h-full bg-black relative overflow-hidden flex flex-col">

            {/* Image */}
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-neutral-100">
                <img
                    src={currentImage && /\.pdf(\?|$)/i.test(currentImage)
                        ? currentImage.replace('/upload/', '/upload/pg_1,f_jpg/')
                        : currentImage}
                    alt={project.title}
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                />
            </div>

            {/* Carousel Navigation */}
            {imageList.length > 1 && (
                <>
                    {/* Left Arrow */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => Math.max(0, i - 1)); }}
                        disabled={currentImageIndex === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all disabled:opacity-20 disabled:scale-100"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    {/* Right Arrow */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => Math.min(imageList.length - 1, i + 1)); }}
                        disabled={currentImageIndex === imageList.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all disabled:opacity-20 disabled:scale-100"
                    >
                        <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                    {/* Dots */}
                    <div className={`absolute left-0 right-0 flex justify-center items-center gap-1.5 z-10 ${isEditing ? 'bottom-[76px]' : 'bottom-4'}`}>
                        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow">
                            {imageList.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                                    className={`rounded-full transition-all duration-200 ${i === currentImageIndex ? 'w-2.5 h-2.5 bg-black' : 'w-2 h-2 bg-black/25 hover:bg-black/50'}`}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Edit Image Overlay */}
            {isEditing && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 border-t border-gray-200 z-20">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 whitespace-nowrap flex items-center gap-1">
                            <ImageIcon size={11} /> {imageList.length}/10
                        </label>
                        <div className="flex gap-2 overflow-x-auto flex-1">
                            {imageList.map((img, i) => (
                                <div
                                    key={i}
                                    onClick={() => setCurrentImageIndex(i)}
                                    className={`relative flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 cursor-pointer transition-all ${i === currentImageIndex ? 'border-black' : 'border-transparent'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                                    >
                                        <X size={9} />
                                    </button>
                                </div>
                            ))}
                            {isUploading ? (
                                <div className="flex-shrink-0 w-12 h-12 rounded border border-gray-200 flex flex-col items-center justify-center gap-1">
                                    <div className="w-8 bg-gray-200 rounded-full h-1">
                                        <div className="bg-black h-1 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                    <span className="text-[9px] text-gray-500 font-bold">{uploadProgress}%</span>
                                </div>
                            ) : imageList.length < 10 ? (
                                <label className="flex-shrink-0 w-12 h-12 rounded border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors">
                                    <Plus size={16} className="text-gray-400" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
                                </label>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Right Side: Project Info */}
        <div className="w-full h-[45%] md:w-[38%] md:h-full bg-white border-t md:border-t-0 md:border-l border-gray-100 flex flex-col relative z-10">
            {/* Close Button (Desktop) */}
            <div className="absolute top-0 right-0 p-4 hidden md:block">
                 <button 
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {/* Header */}
                <div className="mt-1 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded">
                            <EditableField
                                value={project.type || "Project"}
                                onSave={(val) => handleUpdate('type', val)}
                                isEditing={isEditing}
                            />
                        </span>
                    </div>

                    <h2 className="text-2xl font-black mb-1 tracking-tight leading-tight">
                        <EditableField
                            value={project.title}
                            onSave={(val) => handleUpdate('title', val)}
                            isEditing={isEditing}
                        />
                    </h2>
                    
                    {project.type !== 'Activities' && (
                    <div className="text-sm font-mono text-gray-500 mb-3">
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
                    )}

                     <div className="border-b border-gray-100 pb-3 mb-3">
                        <div className="text-sm text-gray-700 font-medium leading-relaxed">
                            <EditableField
                                value={project.description || "No description available."}
                                onSave={(val) => handleUpdate('description', val)}
                                isEditing={isEditing}
                                multiline={true}
                            />
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
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
                    <div className="mb-4">
                        <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
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
            <div className="p-4 border-t border-gray-100 bg-gray-50">
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
                             
                             {isUploading ? (
                                <div className="flex flex-col justify-center gap-1 min-w-[70px]">
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="bg-black h-1.5 rounded-full transition-all duration-200"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-center text-gray-500 font-bold">{uploadProgress}%</span>
                                </div>
                             ) : (
                                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold uppercase cursor-pointer transition-colors">
                                    <Upload size={14} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'pdfUrl')}
                                    />
                                    File
                                </label>
                             )}
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