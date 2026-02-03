import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  type: string;
  author: string;
  date: string;
  image: string;
  description: string;
}

interface FeaturedProjectsProps {
  projects: Project[];
}

export const FeaturedProjects = ({ projects }: FeaturedProjectsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <section className="bg-white text-black py-20 md:py-32 overflow-hidden border-t border-black">
      <div className="container mx-auto px-6 md:px-10 mb-12 flex justify-between items-end">
        <div>
           <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-black rounded-full" />
              <span className="font-mono text-xs uppercase tracking-widest">Selected Works</span>
           </div>
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
             Recent<br />Output
           </h2>
        </div>
        <div className="hidden md:block">
           <p className="font-mono text-xs uppercase tracking-widest text-right">
             Drag to Explore<br />
             ( {projects.length} Items )
           </p>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="w-full overflow-x-auto pl-6 md:pl-10 pb-10 scrollbar-hide cursor-grab active:cursor-grabbing">
        <motion.div 
            className="flex gap-4 md:gap-8 w-max pr-10"
            drag="x"
            dragConstraints={{ right: 0, left: -((projects.length * 400) - window.innerWidth + 100) }}
        >
          {projects.map((project, index) => (
            <div 
              key={project.id} 
              className="group relative w-[300px] md:w-[450px] flex-shrink-0"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 mb-4 border border-black transition-transform duration-500 group-hover:-translate-y-2">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out scale-100 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-white text-black text-xs font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    VIEW PROJECT
                </div>
              </div>

              {/* Text Info */}
              <div className="flex justify-between items-start border-t border-black pt-4">
                 <div>
                    <span className="font-mono text-[10px] block mb-1">0{index + 1} / {project.type.toUpperCase()}</span>
                    <h3 className="text-2xl font-bold uppercase leading-tight group-hover:underline decoration-2 underline-offset-4">
                        {project.title}
                    </h3>
                 </div>
                 <ArrowUpRight className="transform group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </div>
          ))}
          
          {/* 'View All' Card */}
          <div className="w-[200px] md:w-[300px] aspect-[4/3] flex-shrink-0 flex flex-col justify-center items-center border border-dashed border-black hover:bg-black hover:text-white transition-colors cursor-pointer">
              <span className="font-bold text-xl uppercase">View All</span>
              <span className="font-mono text-xs mt-2">Archive &rarr;</span>
          </div>

        </motion.div>
      </div>
    </section>
  );
};
