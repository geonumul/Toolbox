import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import {
  X, Calendar, MapPin, FileText, ArrowRight,
  Image as ImageIcon, Upload, Link as LinkIcon, Save,
  ChevronLeft, ChevronRight, Plus,
} from 'lucide-react';
import { uploadFileToCloudinary } from '../../utils/uploadService';
import { EditableField } from './EditableField';
import { formatAuthors, normalizeAuthors } from '../../utils/authors';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const FALLBACK_AUTHORS = [
  'Ko Geon', 'Park Kyeong-jun', 'Yoo Seung-min', 'Ryu Hyun-jung',
  'Yang Hyung-seok', 'Kwon Si-hyun', 'Kim Ji-eun', 'Shim Jung-eun',
  'Kim Do-kyeong', 'Admin',
];

function AuthorMultiSelect({ value, teamData, onChange }: {
  value: any;
  teamData: any[];
  onChange: (next: string[]) => void;
}) {
  const selected = normalizeAuthors(value);
  const options = (teamData && teamData.length > 0)
    ? teamData.map((m: any) => String(m.name).trim()).filter(Boolean)
    : FALLBACK_AUTHORS;

  const toggle = (name: string) => {
    const trimmed = name.trim();
    if (selected.includes(trimmed)) {
      onChange(selected.filter(a => a !== trimmed));
    } else {
      onChange([...selected, trimmed]);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
        Authors {selected.length > 0 && <span className="text-gray-700 normal-case">· {selected.length} selected</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(name => {
          const active = selected.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`inline-flex items-center px-3.5 py-1.5 text-xs leading-none rounded-full font-medium whitespace-nowrap transition-all ${
                active
                  ? 'bg-black text-white shadow-sm border border-black'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ProjectModalProps {
  project: any;
  onClose: () => void;
  isEditing?: boolean;
  teamData?: any[];
  onUpdate?: (field: string | object, value?: any) => void;
  onSave?: () => void;
  onAutoSave?: (updates: Record<string, any>) => void;
}

const SWIPE_THRESHOLD = 60;
const MAX_IMAGES = 10;

export const ProjectModal = ({
  project, onClose, isEditing = false, teamData = [],
  onUpdate, onSave, onAutoSave,
}: ProjectModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCount, setUploadCount] = useState({ current: 0, total: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  const imageList: string[] = (project.images && project.images.length > 0)
    ? project.images
    : (project.image ? [project.image] : []);

  const currentImage = imageList[currentImageIndex] ?? '';

  useEffect(() => { setCurrentImageIndex(0); }, [project.id]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setCurrentImageIndex(i => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setCurrentImageIndex(i => Math.min(imageList.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, imageList.length]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSwipe = (_: any, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      setCurrentImageIndex(i => Math.min(imageList.length - 1, i + 1));
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      setCurrentImageIndex(i => Math.max(0, i - 1));
    }
  };

  const handleUpdate = (field: string, value: any) => {
    if (!onUpdate) return;
    if (field === 'image' || field === 'pdfUrl') {
      onUpdate({ image: value, pdfUrl: value });
    } else {
      onUpdate(field, value);
    }
  };

  // ────────── Multi-file image upload (sequential) ──────────
  const uploadImageFiles = async (files: File[]) => {
    if (!onUpdate || files.length === 0) return;
    const remaining = MAX_IMAGES - imageList.length;
    if (remaining <= 0) {
      alert(`최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
      return;
    }
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      alert('이미지 파일만 업로드할 수 있어요.');
      return;
    }
    const filesToUpload = imageFiles.slice(0, remaining);
    if (imageFiles.length > remaining) {
      alert(`최대 ${MAX_IMAGES}장. 처음 ${remaining}장만 업로드합니다.`);
    }

    setIsUploading(true);
    setUploadCount({ current: 0, total: filesToUpload.length });

    const newUrls: string[] = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      setUploadCount({ current: i + 1, total: filesToUpload.length });
      setUploadProgress(0);
      try {
        const url = await uploadFileToCloudinary(filesToUpload[i], setUploadProgress);
        newUrls.push(url);
      } catch (err) {
        console.error('Upload failed:', filesToUpload[i].name, err);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    setUploadCount({ current: 0, total: 0 });

    if (newUrls.length === 0) {
      alert('업로드에 실패했어요. 다시 시도해주세요.');
      return;
    }

    const newImages = [...imageList, ...newUrls];
    const updates = { images: newImages, image: newImages[0], pdfUrl: newImages[0] };
    onUpdate(updates);
    if (onAutoSave) onAutoSave(updates);
    setCurrentImageIndex(imageList.length);
  };

  const handleImagePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    uploadImageFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isEditing) return;
    uploadImageFiles(Array.from(e.dataTransfer.files));
  };

  const handleRemoveImage = (index: number) => {
    if (!onUpdate) return;
    const newImages = imageList.filter((_, i) => i !== index);
    const updates = newImages.length > 0
      ? { images: newImages, image: newImages[0], pdfUrl: newImages[0] }
      : { images: [], image: '', pdfUrl: '' };
    onUpdate(updates);
    if (onAutoSave) onAutoSave(updates);
    setCurrentImageIndex(prev => Math.min(prev, Math.max(0, newImages.length - 1)));
  };

  const handleReorderImages = (oldIndex: number, newIndex: number) => {
    if (!onUpdate) return;
    if (oldIndex === newIndex) return;
    const reordered = arrayMove(imageList, oldIndex, newIndex);
    const updates = { images: reordered, image: reordered[0], pdfUrl: reordered[0] };
    onUpdate(updates);
    if (onAutoSave) onAutoSave(updates);
    // Keep the same image visible after reorder.
    if (currentImageIndex === oldIndex) {
      setCurrentImageIndex(newIndex);
    } else if (oldIndex < currentImageIndex && newIndex >= currentImageIndex) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (oldIndex > currentImageIndex && newIndex <= currentImageIndex) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpdate) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadCount({ current: 1, total: 1 });
    try {
      const url = await uploadFileToCloudinary(file, setUploadProgress);
      if (file.type.startsWith('image/')) {
        const updates = { image: url, pdfUrl: url };
        onUpdate(updates);
        if (onAutoSave) onAutoSave(updates);
      } else {
        onUpdate('pdfUrl', url);
        if (onAutoSave) onAutoSave({ pdfUrl: url });
      }
    } catch {
      alert('파일 업로드 실패. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadCount({ current: 0, total: 0 });
    }
  };

  const handleSaveClick = () => {
    if (project.type !== 'Activities' && !project.author?.trim()) {
      alert('Author를 선택해주세요.');
      return;
    }
    if (onSave) {
      onSave();
      alert('저장되었습니다.');
    }
  };

  if (!project) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 md:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        style={{ width: 'min(1550px, 92vw)', height: 'min(950px, 88vh)' }}
        className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => { if (isEditing) { e.preventDefault(); setIsDragOver(true); } }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/90 backdrop-blur text-black rounded-full shadow hover:bg-white transition md:hidden"
        >
          <X size={20} />
        </button>

        {/* Drag-drop overlay */}
        <AnimatePresence>
          {isDragOver && isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-3 z-[55] bg-black/70 border-4 border-dashed border-white rounded-xl pointer-events-none flex items-center justify-center"
            >
              <div className="text-white text-center">
                <Upload size={48} className="mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-lg font-bold">Drop images here</p>
                <p className="text-sm opacity-70">최대 {MAX_IMAGES - imageList.length}장 추가</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ────────── LEFT: Image carousel ────────── */}
        <div className="w-full h-[55vh] md:w-[65%] lg:w-[68%] md:h-full bg-neutral-950 relative overflow-hidden flex flex-col group/carousel">
          {/* Image area — flex-1 takes remaining height above the strip */}
          <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden">
          {imageList.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              {isEditing ? (
                <label className="cursor-pointer text-center text-white/70 hover:text-white transition">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center">
                    <Upload size={42} strokeWidth={1.5} />
                  </div>
                  <p className="text-base font-bold mb-1">Click 또는 drag로 업로드</p>
                  <p className="text-xs opacity-70">JPG · PNG · 한 번에 여러 장 가능</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImagePicker}
                  />
                </label>
              ) : (
                <div className="text-white/40 text-sm">No images</div>
              )}
            </div>
          ) : (
            <>
              <motion.div
                drag={imageList.length > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                dragSnapToOrigin
                onDragEnd={handleSwipe}
                className={`absolute inset-0 flex items-center justify-center p-4 ${imageList.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  src={currentImage && /\.pdf(\?|$)/i.test(currentImage)
                    ? currentImage.replace('/upload/', '/upload/pg_1,f_jpg/')
                    : currentImage}
                  alt={project.title}
                  style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                  className="object-contain select-none pointer-events-none"
                  draggable={false}
                />
              </motion.div>

              {/* Counter pill */}
              {imageList.length > 1 && (
                <div className="absolute top-4 left-4 z-30 bg-black/70 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none">
                  {currentImageIndex + 1} / {imageList.length}
                </div>
              )}

              {/* Arrows */}
              {imageList.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => i - 1); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/90 hover:bg-white rounded-full shadow-xl flex items-center justify-center md:opacity-0 md:group-hover/carousel:opacity-100 transition-all hover:scale-105 active:scale-95"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={22} strokeWidth={2.5} />
                    </button>
                  )}
                  {currentImageIndex < imageList.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => i + 1); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/90 hover:bg-white rounded-full shadow-xl flex items-center justify-center md:opacity-0 md:group-hover/carousel:opacity-100 transition-all hover:scale-105 active:scale-95"
                      aria-label="Next image"
                    >
                      <ChevronRight size={22} strokeWidth={2.5} />
                    </button>
                  )}
                </>
              )}

              {/* Dots */}
              {imageList.length > 1 && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 z-30 flex gap-1.5 bg-black/40 backdrop-blur px-3 py-2 rounded-full"
                  style={{ bottom: '16px' }}
                >
                  {imageList.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                      className={`rounded-full transition-all ${i === currentImageIndex ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          </div>

          {/* Thumbnail strip — real flex child below the image area in edit mode */}
          {isEditing && (
            <ThumbnailStrip
              imageList={imageList}
              currentImageIndex={currentImageIndex}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadCount={uploadCount}
              onSelect={setCurrentImageIndex}
              onRemove={handleRemoveImage}
              onPick={handleImagePicker}
              onReorder={handleReorderImages}
            />
          )}
        </div>

        {/* ────────── RIGHT: Info panel ────────── */}
        <div className="w-full flex-1 md:w-[35%] lg:w-[32%] md:h-full bg-white border-t md:border-t-0 md:border-l border-gray-100 flex flex-col relative z-10">
          {/* Desktop close */}
          <div className="absolute top-0 right-0 p-4 hidden md:block">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            <div className="mt-2 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded">
                  <EditableField
                    value={project.type || 'Project'}
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

              {project.type !== 'Activities' && (
                <div className="text-sm font-mono text-gray-500 mb-6">
                  {isEditing ? (
                    <AuthorMultiSelect
                      value={project.author}
                      teamData={teamData}
                      onChange={(next) => handleUpdate('author', next)}
                    />
                  ) : (
                    formatAuthors(project.author)
                  )}
                </div>
              )}

              <div className="border-b border-gray-100 pb-6 mb-6">
                <div className="text-base text-gray-700 font-medium leading-relaxed">
                  <EditableField
                    value={project.description || 'No description available.'}
                    onSave={(val) => handleUpdate('description', val)}
                    isEditing={isEditing}
                    multiline
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                    <MapPin size={10} /> Location
                  </h4>
                  <p className="text-xs font-bold text-gray-900">
                    <EditableField
                      value={project.site || '-'}
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
                      value={project.date || '-'}
                      onSave={(val) => handleUpdate('date', val)}
                      isEditing={isEditing}
                    />
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1">
                  <FileText size={10} /> Project Details
                </h4>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  <EditableField
                    value={project.detailContent || 'Add detailed project description here...'}
                    onSave={(val) => handleUpdate('detailContent', val)}
                    isEditing={isEditing}
                    multiline
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            {isEditing ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-gray-400">
                    Attachment (PDF, ZIP …)
                  </label>
                  <button
                    onClick={handleSaveClick}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition flex items-center gap-1"
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

                  {isUploading && uploadCount.total === 1 ? (
                    <div className="flex flex-col justify-center gap-1 min-w-[70px]">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-black h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <span className="text-[10px] text-center text-gray-500 font-bold">{uploadProgress}%</span>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold uppercase cursor-pointer transition">
                      <Upload size={14} />
                      <input type="file" className="hidden" onChange={handleAttachmentUpload} />
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
                className={`w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition rounded flex items-center justify-center gap-2 group ${(!project.pdfUrl || project.pdfUrl === '#') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
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

// ────────── Sortable thumbnail strip ──────────

interface ThumbnailStripProps {
  imageList: string[];
  currentImageIndex: number;
  isUploading: boolean;
  uploadProgress: number;
  uploadCount: { current: number; total: number };
  onSelect: (i: number) => void;
  onRemove: (i: number) => void;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}

function ThumbnailStrip({
  imageList, currentImageIndex, isUploading, uploadProgress, uploadCount,
  onSelect, onRemove, onPick, onReorder,
}: ThumbnailStripProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return;
    onReorder(oldIndex, newIndex);
  };

  return (
    <div className="flex-shrink-0 bg-black/55 backdrop-blur-md border-t border-white/15 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 whitespace-nowrap flex items-center gap-1 mr-1">
          <ImageIcon size={12} /> {imageList.length}/{MAX_IMAGES}
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={imageList.map((_, i) => i)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-2">
                {imageList.map((img, i) => (
                  <SortableThumbnail
                    key={`${img}-${i}`}
                    index={i}
                    src={img}
                    active={i === currentImageIndex}
                    onSelect={() => onSelect(i)}
                    onRemove={() => onRemove(i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {isUploading ? (
            <div className="flex-shrink-0 w-16 h-16 rounded-md border border-white/30 flex flex-col items-center justify-center gap-1 bg-black/50">
              <div className="w-10 bg-white/20 rounded-full h-1">
                <div className="bg-white h-1 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="text-[9px] text-white font-bold">
                {uploadCount.total > 1 ? `${uploadCount.current}/${uploadCount.total}` : `${uploadProgress}%`}
              </span>
            </div>
          ) : imageList.length < MAX_IMAGES ? (
            <label
              className="flex-shrink-0 w-16 h-16 rounded-md border-2 border-dashed border-white/40 flex items-center justify-center cursor-pointer hover:border-white hover:bg-white/10 text-white/70 hover:text-white transition"
              title="이미지 추가"
            >
              <Plus size={20} />
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface SortableThumbnailProps {
  index: number;
  src: string;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableThumbnail({ index, src, active, onSelect, onRemove }: SortableThumbnailProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: index });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all touch-none ${
        active ? 'border-white shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
      }`}
    >
      <img
        src={src}
        className="w-full h-full object-cover pointer-events-none select-none"
        alt=""
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      />
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white p-1 rounded-bl"
        aria-label="Remove image"
      >
        <X size={12} />
      </button>
    </div>
  );
}
