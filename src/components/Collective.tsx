import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, Network } from 'lucide-react';

export const Collective = () => {
  const [codeLines, setCodeLines] = useState<string[]>([]);
  
  useEffect(() => {
    const snippets = [
      "INITIALIZING NEURAL LINK...",
      "LOADING AGENT_01... [OK]",
      "LOADING AGENT_02... [OK]",
      "OPTIMIZING GEOMETRY... 98%",
      "GENERATING SPATIAL DATA...",
      "SYNCING WITH CLOUD...",
      ">> EXECUTE BUILD_SEQUENCE"
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      setCodeLines(prev => [...prev.slice(-5), snippets[i % snippets.length]]);
      i++;
    }, 800);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-32 px-6 bg-black text-white relative overflow-hidden">
       {/* Scrolling Binary Background */}
       <div className="absolute inset-0 opacity-10 font-mono text-[10px] leading-3 overflow-hidden break-all pointer-events-none select-none text-gray-500">
          {Array(2000).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('')}
       </div>

       <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-24 relative z-10 items-center">
          <div>
             <div className="flex items-center gap-2 mb-6 text-gray-400 font-mono text-xs animate-pulse">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                SYSTEM_ONLINE
             </div>
             
             <h2 className="text-[10vw] md:text-[6vw] leading-[0.9] font-black tracking-tighter mb-12 font-mono">
               THE<br/>
               <span className="text-white">HIVE_MIND</span>
             </h2>
             
             <div className="space-y-12">
                <p className="text-xl md:text-2xl font-light leading-snug text-gray-400 font-mono">
                  // We are a decentralized neural network of 9 specialists.
                  // Merging physical architecture with algorithmic intelligence.
                </p>
                
                <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-none font-mono text-xs text-gray-300">
                   <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-2">
                      <Terminal size={14} />
                      <span>TERMINAL_OUTPUT</span>
                   </div>
                   <div className="space-y-1 font-mono opacity-80 h-32 overflow-hidden flex flex-col justify-end">
                      {codeLines.map((line, idx) => (
                        <div key={idx} className="typing-effect">{`> ${line}`}</div>
                      ))}
                      <div className="animate-pulse">_</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="relative">
             <div className="relative border border-neutral-700 bg-neutral-900 overflow-hidden group">
                 {/* Decorative Header */}
                 <div className="h-8 bg-neutral-800 flex items-center px-4 gap-2 border-b border-neutral-700">
                    <div className="w-3 h-3 rounded-full bg-neutral-600" />
                    <div className="w-3 h-3 rounded-full bg-neutral-600" />
                    <div className="w-3 h-3 rounded-full bg-neutral-600" />
                    <span className="ml-auto font-mono text-[10px] text-gray-400">CPU_USAGE: 89%</span>
                 </div>
                 
                 {/* Image Content */}
                 <div className="relative aspect-square overflow-hidden">
                     <img 
                        src="https://images.unsplash.com/photo-1640552435845-d65c23b75934?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                        alt="AI Processing"
                        className="w-full h-full object-cover mix-blend-screen opacity-50 grayscale group-hover:scale-110 transition-transform duration-1000"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                     
                     {/* Floating Data Nodes */}
                     <motion.div 
                        className="absolute top-1/4 left-1/4 p-2 bg-black/50 backdrop-blur border border-white text-white text-[10px] font-mono"
                        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
                        transition={{ duration: 5, repeat: Infinity }}
                     >
                        NODE_01
                     </motion.div>
                     <motion.div 
                        className="absolute bottom-1/3 right-1/4 p-2 bg-black/50 backdrop-blur border border-gray-400 text-gray-400 text-[10px] font-mono"
                        animate={{ x: [0, -30, 0], y: [0, 10, 0] }}
                        transition={{ duration: 7, repeat: Infinity }}
                     >
                        DATA_STREAM
                     </motion.div>
                 </div>
                 
                 {/* Stats Footer */}
                 <div className="grid grid-cols-3 border-t border-neutral-700 divide-x divide-neutral-700 bg-neutral-800">
                    <div className="p-4 text-center">
                       <Cpu className="mx-auto mb-2 text-gray-400" size={20} />
                       <div className="text-[10px] font-mono text-gray-500">CORES</div>
                       <div className="text-lg font-bold">128</div>
                    </div>
                    <div className="p-4 text-center">
                       <Network className="mx-auto mb-2 text-gray-400" size={20} />
                       <div className="text-[10px] font-mono text-gray-500">NODES</div>
                       <div className="text-lg font-bold">9</div>
                    </div>
                    <div className="p-4 text-center">
                       <Terminal className="mx-auto mb-2 text-gray-400" size={20} />
                       <div className="text-[10px] font-mono text-gray-500">COMMITS</div>
                       <div className="text-lg font-bold">4.2k</div>
                    </div>
                 </div>
             </div>
          </div>
       </div>
    </section>
  );
};
