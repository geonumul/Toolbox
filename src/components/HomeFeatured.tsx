import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ScanLine } from 'lucide-react';
import { useData } from '../utils/data';
import { ProjectModal } from './ui/ProjectModal';

export const HomeFeatured = () => {
  const { data } = useData();
  const projects = data?.gallery?.slice(0, 3) || [];
  const [selectedProject, setSelectedProject] = useState<any>(null);

  return (
    <>
        <section className="py-32 px-6 bg-white relative z-10 border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto">
            <div className="flex justify-between items-end mb-24 border-b border-black/10 pb-4">
                <div>
                    <div className="font-mono text-xs text-neutral-500 mb-2 animate-pulse">● DETECTED_PROJECTS: {projects.length}</div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">SELECTED_WORKS</h2>
                </div>
                <span className="font-mono text-xs text-neutral-400 hidden md:block text-right">
                    SCAN_COMPLETE <br/>
                    INDEX (01-03)
                </span>
            </div>

            <div className="space-y-32">
            {projects.map((project: any, index: number) => (
                <div key={project.id} className="group flex flex-col md:flex-row gap-12 md:gap-24 items-center">
                {/* Image Side */}
                <div className={`w-full md:w-3/5 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    <div className="overflow-hidden relative aspect-[16/10] bg-gray-100 cursor-pointer" onClick={() => setSelectedProject(project)}>
                        <motion.img 
                            initial={{ scale: 1.1, filter: "grayscale(100%)" }}
                            whileInView={{ scale: 1, filter: "grayscale(0%)" }}
                            transition={{ duration: 1.2, ease: "circOut" }}
                            viewport={{ once: true }}
                            src={project.image} 
                            alt={project.title}
                            className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                        />
                        
                        {/* Scanning Effect Overlay - Changed to Grayscale */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/20 to-white/0 mix-blend-overlay opacity-0 group-hover:opacity-100 h-full w-full pointer-events-none transform translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-in-out" />
                        
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 font-mono text-xs font-medium border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                            CLICK_TO_ANALYZE
                        </div>
                    </div>
                </div>

                {/* Text Side */}
                <div className={`w-full md:w-2/5 ${index % 2 === 1 ? 'md:order-1 text-right' : ''}`}>
                    <div className="font-mono text-xs text-neutral-400 mb-4 flex items-center gap-2 justify-end md:justify-start" style={{ justifyContent: index % 2 === 1 ? 'flex-end' : 'flex-start' }}>
                        <ScanLine size={14} />
                        <span>0{index + 1} / {project.type}</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight group-hover:text-neutral-500 transition-colors cursor-pointer" onClick={() => setSelectedProject(project)}>
                        {project.title}
                    </h3>
                    <p className="text-gray-600 text-base md:text-lg mb-8 leading-relaxed font-light">
                    {project.description}
                    </p>
                    <button 
                        onClick={() => setSelectedProject(project)}
                        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:gap-4 hover:border-neutral-500 hover:text-neutral-500 transition-all ${index % 2 === 1 ? 'ml-auto' : ''}`}
                    >
                    Initialize View <ArrowRight size={14} />
                    </button>
                </div>
                </div>
            ))}
            </div>
        </div>
        </section>

        <AnimatePresence>
            {selectedProject && (
                <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
            )}
        </AnimatePresence>
    </>
  );
};
