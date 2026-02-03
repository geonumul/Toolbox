import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { Filter } from 'lucide-react';

const projects = [
  {
    id: 1,
    title: "The White House Remodel",
    category: "Architecture",
    author: "Agent 01 + 04",
    image: "https://images.unsplash.com/photo-1720442617080-c25f9955194c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aGl0ZSUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nJTIwZXh0ZXJpb3IlMjBtaW5pbWFsaXN0fGVufDF8fHx8MTc3MDA4NjQ4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 2,
    title: "Algorithmic Interior",
    category: "Generative",
    author: "Agent 03",
    image: "https://images.unsplash.com/photo-1765948079484-3bb1af6e5268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmlnaHQlMjB3aGl0ZSUyMGludGVyaW9yJTIwZGVzaWduJTIwbGl2aW5nJTIwcm9vbSUyMHN1bmxpdHxlbnwxfHx8fDE3NzAwODY0ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 3,
    title: "Reactive Facade",
    category: "Creative Coding",
    author: "Agent 07 + 09",
    image: "https://images.unsplash.com/photo-1740326874921-1b717d1059f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoaXRlY3R1cmFsJTIwZGV0YWlscyUyMGNvbmNyZXRlJTIwZ2xhc3MlMjB3aGl0ZXxlbnwxfHx8fDE3NzAwODY0ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 4,
    title: "Neural Workspace",
    category: "Interior",
    author: "Agent 02",
    image: "https://images.unsplash.com/photo-1765366417046-f46361a7f26f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBpbnRlcmlvciUyMGJyaWdodCUyMGNyZWF0aXZlJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3MDA4NjQ4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 5,
    title: "Data Sculpture",
    category: "Installation",
    author: "Agent 05",
    image: "https://images.unsplash.com/photo-1720442617080-c25f9955194c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aGl0ZSUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nJTIwZXh0ZXJpb3IlMjBtaW5pbWFsaXN0fGVufDF8fHx8MTc3MDA4NjQ4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
   {
    id: 6,
    title: "Fluid Space",
    category: "Architecture",
    author: "Collective",
    image: "https://images.unsplash.com/photo-1765948079484-3bb1af6e5268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmlnaHQlMjB3aGl0ZSUyMGludGVyaW9yJTIwZGVzaWduJTIwbGl2aW5nJTIwcm9vbSUyMHN1bmxpdHxlbnwxfHx8fDE3NzAwODY0ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

export const Gallery = () => {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Architecture", "Generative", "Interior"];

  const filteredProjects = filter === "All" 
    ? projects 
    : projects.filter(p => p.category === filter || p.category === "Creative Coding");

  return (
    <section id="work" className="py-24 px-6 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-4 tracking-tighter"
          >
            SELECTED OUTPUTS
          </motion.h2>
          <p className="text-gray-500 font-mono text-sm">ARCHIVE_VERSION_2.0 // 2026</p>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === cat 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto min-h-[500px]">
        <ResponsiveMasonry
          columnsCountBreakPoints={{350: 1, 750: 2, 900: 3}}
        >
          <Masonry gutter="2rem">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                layoutId={`project-${project.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="group cursor-pointer mb-8"
              >
                <div className="overflow-hidden mb-4 relative rounded-lg bg-white shadow-sm">
                  {/* Image */}
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 filter group-hover:brightness-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay Info on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-white border border-white/50 px-6 py-2 rounded-full backdrop-blur-md">
                      VIEW_PROJECT
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">{project.title}</h3>
                    <p className="text-xs text-blue-600 font-mono mt-1 uppercase">{project.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-gray-200 px-2 py-1 rounded text-gray-600 font-mono">
                      {project.author}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      </div>
    </section>
  );
};
