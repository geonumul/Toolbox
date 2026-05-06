import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectModal } from '../ui/ProjectModal';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { authorsMatch, formatAuthors } from '../../utils/authors';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GalleryPageProps {
  data: any[];
  initialTab?: string;
  teamData?: any[];
  updateData?: (key: string, value: any) => void;
  isEditing?: boolean;
}

export const GalleryPage = ({ data, initialTab = 'Projects', teamData = [], updateData, isEditing = false }: GalleryPageProps) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedProjectId, setSelectedProjectId] = useState<string | number | null>(null);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [editBuffer, setEditBuffer] = useState<Record<string, any>>({});
  const [activeDragId, setActiveDragId] = useState<string | number | null>(null);
  const [localOrder, setLocalOrder] = useState<(string | number)[] | null>(null);

  const rawSelectedProject = selectedProjectId ? data.find(p => p.id === selectedProjectId) : null;
  const selectedProject = rawSelectedProject ? { ...rawSelectedProject, ...editBuffer } : null;

  const authorsList = teamData && teamData.length > 0
    ? teamData.map((m: any) => String(m.name).trim())
    : ['Ko Geon', 'Park Kyeong-jun', 'Yoo Seung-min'];

  useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);

  // ────────── Sorting + Filtering ──────────
  const tabData = useMemo(() => {
    const sorted = [...data]
      .filter(item => item.type === activeTab)
      .sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        const at = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0).getTime();
        const bt = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0).getTime();
        return bt - at;
      });

    if (localOrder) {
      const byId = new Map(sorted.map(item => [item.id, item]));
      const reordered = localOrder.map(id => byId.get(id)).filter(Boolean);
      const missing = sorted.filter(item => !localOrder.includes(item.id));
      return [...reordered, ...missing] as any[];
    }
    return sorted;
  }, [data, activeTab, localOrder]);

  const filteredData = tabData.filter(item => authorsMatch(item.author, selectedAuthors));

  const reorderEnabled = isEditing && selectedAuthors.length === 0;

  // ────────── Drag handlers ──────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string | number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredData.findIndex(p => p.id === active.id);
    const newIndex = filteredData.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredData, oldIndex, newIndex);
    setLocalOrder(reordered.map(p => p.id));

    try {
      const batch = writeBatch(db);
      reordered.forEach((p, idx) => {
        if (typeof p.id === 'string') {
          batch.update(doc(db, 'projects', p.id), { order: idx });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error('Reorder save failed:', err);
      alert('순서 저장에 실패했어요. 새로고침 후 다시 시도해주세요.');
    }
  };

  // Reset local order whenever the data identity changes (e.g. add/delete)
  useEffect(() => {
    setLocalOrder(null);
  }, [data.length, activeTab]);

  // ────────── Filter / Author handlers ──────────
  const toggleAuthor = (author: string) => {
    setSelectedAuthors(prev => prev.includes(author) ? prev.filter(a => a !== author) : [...prev, author]);
  };
  const clearAuthors = () => setSelectedAuthors([]);

  // ────────── Project CRUD ──────────
  const handleUpdateProject = (_id: number | string, field: string | object, value?: any) => {
    const updates: Record<string, any> = typeof field === 'string' ? { [field]: value } : field;
    setEditBuffer(prev => ({ ...prev, ...updates }));
  };

  const handleAddProject = async () => {
    try {
      const maxOrder = tabData.reduce((max, p) => {
        return typeof p.order === 'number' && p.order > max ? p.order : max;
      }, -1);
      const newProject = {
        title: 'New Project',
        type: activeTab,
        author: [],
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        description: 'Project description...',
        createdAt: new Date(),
        order: maxOrder + 1,
        site: '-',
        detailContent: '',
        pdfUrl: '',
      };
      const docRef = await addDoc(collection(db, 'projects'), newProject);
      setSelectedProjectId(docRef.id as any);
    } catch (err) {
      console.error('Error adding project:', err);
      alert('프로젝트 생성 실패: ' + err);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      if (typeof id === 'string') {
        await deleteDoc(doc(db, 'projects', id));
      } else if (updateData) {
        updateData('gallery', data.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed: ' + err);
    }
  };

  const handleAutoSave = async (id: string | number, updates: Record<string, any>) => {
    setEditBuffer(prev => ({ ...prev, ...updates }));
    if (typeof id !== 'string') return;
    try {
      const projectRef = doc(db, 'projects', id);
      const merged = { ...rawSelectedProject, ...editBuffer, ...updates };
      const dataToSave: Record<string, any> = {
        title: merged.title,
        type: merged.type,
        description: merged.description,
        author: merged.author,
        image: merged.image,
        images: merged.images,
        site: merged.site,
        date: merged.date,
        detailContent: merged.detailContent,
        pdfUrl: merged.pdfUrl,
      };
      Object.keys(dataToSave).forEach(k => { if (dataToSave[k] === undefined) delete dataToSave[k]; });
      await updateDoc(projectRef, dataToSave);
    } catch (err) {
      console.error('Auto-save failed:', err);
      alert('이미지 저장 실패: ' + err);
    }
  };

  const handleSaveProjectToDB = async (project: any) => {
    if (typeof project.id === 'string') {
      try {
        const projectRef = doc(db, 'projects', project.id);
        const dataToSave: Record<string, any> = {
          title: project.title,
          type: project.type,
          description: project.description,
          author: project.author,
          image: project.image,
          images: project.images,
          site: project.site,
          date: project.date,
          detailContent: project.detailContent,
          pdfUrl: project.pdfUrl,
        };
        Object.keys(dataToSave).forEach(k => { if (dataToSave[k] === undefined) delete dataToSave[k]; });
        await updateDoc(projectRef, dataToSave);
      } catch (err) {
        console.error('Save failed:', err);
        alert('Failed to save: ' + err);
      }
    }
    setEditBuffer({});
    setSelectedProjectId(null);
  };

  const activeDragItem = activeDragId ? filteredData.find(p => p.id === activeDragId) : null;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen pt-24 md:pt-32 px-4 md:px-6 pb-24"
      >
        <div className="max-w-[1600px] mx-auto">
          {/* Tab toggle */}
          <div className="flex justify-center mb-8 md:mb-12">
            <div className="inline-flex bg-muted rounded-full p-1 relative w-full max-w-[320px] md:max-w-none md:w-auto">
              <motion.div
                className="absolute top-1 bottom-1 bg-background rounded-full shadow-sm"
                initial={false}
                animate={{
                  left: activeTab === 'Projects' ? '4px' : '50%',
                  right: activeTab === 'Projects' ? '50%' : '4px',
                  width: 'calc(50% - 4px)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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

          {/* Author filter */}
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
                  {authorsList.map((author, i) => (
                    <React.Fragment key={author}>
                      <button
                        onClick={() => toggleAuthor(author)}
                        className={`text-sm font-mono uppercase tracking-tight transition-colors ${selectedAuthors.includes(author) ? 'font-bold text-primary border-b border-primary' : 'text-muted-foreground hover:text-primary'}`}
                      >
                        {author}
                      </button>
                      {i < authorsList.length - 1 && <span className="text-muted text-xs">|</span>}
                    </React.Fragment>
                  ))}
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

                {reorderEnabled && filteredData.length > 1 && (
                  <p className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-6">
                    💡 카드를 드래그해서 순서를 바꿀 수 있어요
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid */}
          {reorderEnabled ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filteredData.map(p => p.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 gap-y-16">
                  {filteredData.map(item => (
                    <SortableCard
                      key={item.id}
                      item={item}
                      activeTab={activeTab}
                      onOpen={() => setSelectedProjectId(item.id)}
                      onDelete={(e) => handleDeleteProject(e, item.id)}
                      isEditing
                    />
                  ))}
                  <AddCard activeTab={activeTab} onClick={handleAddProject} />
                </div>
              </SortableContext>

              <DragOverlay>
                {activeDragItem ? (
                  <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
                    <ProjectCardInner item={activeDragItem} activeTab={activeTab} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 gap-y-16">
              {filteredData.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="group cursor-pointer flex flex-col h-full relative"
                  onClick={() => setSelectedProjectId(item.id)}
                >
                  <ProjectCardInner item={item} activeTab={activeTab} />
                  {isEditing && (
                    <button
                      onClick={(e) => handleDeleteProject(e, item.id)}
                      className="absolute top-2 right-2 z-50 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg hover:scale-110 active:scale-95"
                      title="Delete Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </motion.div>
              ))}
              {isEditing && <AddCard activeTab={activeTab} onClick={handleAddProject} />}
            </div>
          )}

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
            key={selectedProject.id}
            project={selectedProject}
            onClose={() => { setEditBuffer({}); setSelectedProjectId(null); }}
            isEditing={isEditing}
            teamData={teamData}
            onUpdate={(field, val) => handleUpdateProject(selectedProject.id, field, val)}
            onSave={() => handleSaveProjectToDB(selectedProject)}
            onAutoSave={(updates) => handleAutoSave(selectedProject.id, updates)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ────────── Subcomponents ──────────

function ProjectCardInner({ item, activeTab }: { item: any; activeTab: string }) {
  return (
    <>
      <div className="overflow-hidden aspect-square bg-muted relative mb-4">
        <img
          src={/\.pdf(\?|$)/i.test(item.image) ? item.image.replace('/upload/', '/upload/pg_1,f_jpg/') : item.image}
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
        <div className="flex justify-between items-baseline font-mono text-[10px] text-muted-foreground uppercase tracking-wide gap-3">
          {activeTab !== 'Activities' && <span className="truncate">{formatAuthors(item.author)}</span>}
          <span className="flex-shrink-0">{item.date || '2026.01.01'}</span>
        </div>
      </div>
    </>
  );
}

function SortableCard({ item, activeTab, onOpen, onDelete, isEditing }: {
  item: any;
  activeTab: string;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isEditing: boolean;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex flex-col h-full relative"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-50 bg-black/70 text-white p-1.5 rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        title="드래그해서 순서 변경"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </button>

      {/* Clickable card body */}
      <div className="cursor-pointer flex flex-col h-full" onClick={onOpen}>
        <ProjectCardInner item={item} activeTab={activeTab} />
      </div>

      {isEditing && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 z-50 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg hover:scale-110 active:scale-95"
          title="Delete Project"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

function AddCard({ activeTab, onClick }: { activeTab: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer"
    >
      <Plus size={48} strokeWidth={1} />
      <span className="mt-4 font-bold uppercase tracking-widest text-xs">Add {activeTab}</span>
    </div>
  );
}
