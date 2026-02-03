import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';

const members = [
    { name: "Sarah Kim", role: "Arch", id: "01" },
    { name: "David Park", role: "Code", id: "02" },
    { name: "Ji-Min Lee", role: "Design", id: "03" },
    { name: "Alex Chen", role: "AI", id: "04" },
    { name: "Ryan Go", role: "Sound", id: "05" },
    { name: "Elena Wu", role: "Visual", id: "06" },
];

export const Team = () => {
  return (
    <section className="bg-gray-50 text-black py-32 px-6">
       <div className="max-w-[1400px] mx-auto">
           <div className="mb-24">
               <h2 className="text-[10vw] font-black leading-[0.8] tracking-tighter mb-8 text-black">
                   THE<br/>AGENTS
               </h2>
               <p className="max-w-2xl text-xl font-medium text-gray-600">
                   We are a distributed network of specialists working at the edge of possibility.
                   No hierarchy. Just pure output.
               </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
               {members.map((member) => (
                   <motion.div 
                     key={member.id}
                     whileHover={{ backgroundColor: "#000", color: "#fff" }}
                     className="bg-white p-12 h-80 flex flex-col justify-between group cursor-pointer transition-colors"
                   >
                       <div className="flex justify-between items-start">
                           <span className="font-mono text-xs font-bold border border-black group-hover:border-white px-2 py-1 rounded-full">
                               ID_{member.id}
                           </span>
                           <Plus className="opacity-0 group-hover:opacity-100 transition-opacity group-hover:rotate-90 duration-500" />
                       </div>
                       
                       <div>
                           <div className="font-mono text-xs uppercase tracking-widest mb-2 opacity-50 group-hover:opacity-80">
                               {member.role}
                           </div>
                           <h3 className="text-4xl font-bold tracking-tighter">{member.name}</h3>
                       </div>
                   </motion.div>
               ))}
           </div>
       </div>
    </section>
  );
};
