import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

const projects = [
  { id: 1, title: "VOID_TOWER", category: "Architecture", img: "https://images.unsplash.com/photo-1742124454615-8f174e636aec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: 2, title: "NEURAL_SCAPE", category: "Generative", img: "https://images.unsplash.com/photo-1667000190543-86091e737f20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: 3, title: "DARK_MATTER", category: "Installation", img: "https://images.unsplash.com/photo-1719834430266-922722e6a9c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { id: 4, title: "CYBER_DORM", category: "Interior", img: "https://images.unsplash.com/photo-1640552435845-d65c23b75934?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" }
];

export const Work = () => {
  return (
    <section className="bg-white text-black py-32 px-6">
      <div className="max-w-[1400px] mx-auto">
         <div className="flex items-end justify-between mb-24 border-b border-black/20 pb-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">SELECTED_WORKS</h2>
            <span className="font-mono text-sm">(01 - 04)</span>
         </div>

         <div className="space-y-32">
            {projects.map((project, index) => (
                <div key={project.id} className="group relative">
                    <div className="grid md:grid-cols-12 gap-8 items-center">
                        <div className={`md:col-span-8 overflow-hidden ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                             <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                                 <motion.img 
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.7 }}
                                    src={project.img} 
                                    alt={project.title}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                 />
                                 {/* Hover Overlay */}
                                 <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                     <div className="w-32 h-32 rounded-full border border-black flex items-center justify-center bg-black text-white font-bold uppercase tracking-widest text-xs transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                        View Case
                                     </div>
                                 </div>
                             </div>
                        </div>
                        
                        <div className={`md:col-span-4 ${index % 2 === 1 ? 'md:order-1 text-right' : ''}`}>
                            <div className="flex flex-col gap-4">
                                <span className="font-mono text-xs text-gray-500 uppercase">Project 0{index + 1}</span>
                                <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.8] stroke-text-black hover:text-black transition-colors cursor-pointer">
                                    {project.title}
                                </h3>
                                <div className={`flex items-center gap-4 border-t border-black/20 pt-4 mt-4 ${index % 2 === 1 ? 'justify-end' : ''}`}>
                                     <span className="text-sm font-medium">{project.category}</span>
                                     <ArrowUpRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </section>
  );
};
