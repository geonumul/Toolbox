import React from 'react';
import { motion } from 'motion/react';
import assetImage from 'figma:asset/67ed619bcdb38e968f9f08b86914db4a259a68a8.png';

export const FeaturedArt = () => {
  return (
    <section id="studio" className="py-24 px-6 bg-gray-50 overflow-hidden relative">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        
        {/* Text Side */}
        <div className="order-2 md:order-1 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Complexity in<br/>Simplicity</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Our design philosophy embraces the chaotic beauty of interconnected systems. 
              Much like the underlying networks of a city or the microscopic details of materials, 
              we find structure within the noise.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-[1px] bg-black"></div>
                <span className="text-sm uppercase tracking-widest">Generative Design</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-[1px] bg-black"></div>
                <span className="text-sm uppercase tracking-widest">Sustainable Systems</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-[1px] bg-black"></div>
                <span className="text-sm uppercase tracking-widest">Future Living</span>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-12 px-8 py-3 bg-black text-white text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Read Philosophy
            </motion.button>
          </motion.div>
        </div>

        {/* Image Side - Using the user provided asset */}
        <div className="order-1 md:order-2 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* The Asset Frame */}
            <div className="relative z-10 p-4 bg-white shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
               <img 
                 src={assetImage} 
                 alt="Architectural Concept Map" 
                 className="w-full h-auto bg-black"
               />
               <div className="mt-2 flex justify-between items-center opacity-50">
                 <span className="text-[10px] font-mono">FIG. 001 - NETWORK STUDY</span>
                 <span className="text-[10px] font-mono">2026</span>
               </div>
            </div>

            {/* Decorative Elements around it to integrate the dark image into bright theme */}
            <motion.div 
              className="absolute -top-10 -right-10 w-32 h-32 border-2 border-black/10 z-0"
              animate={{ rotate: 90 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
             <motion.div 
              className="absolute -bottom-10 -left-10 w-64 h-64 bg-gray-200/50 rounded-full z-0 mix-blend-multiply"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
