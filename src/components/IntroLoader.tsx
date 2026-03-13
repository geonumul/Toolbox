import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const IntroLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 800; // Reduced to 0.8 seconds for faster loading
    const intervalTime = 10;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setCount(progress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(onComplete, 200);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center text-black"
      exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
    >
      <div className="w-full max-w-md px-6">
        <div className="flex justify-between items-end mb-2 font-mono text-sm">
           <span>TOOLBOX_OS v2.0</span>
           <span>{count}%</span>
        </div>
        <div className="w-full h-[1px] bg-gray-200 relative overflow-hidden">
           <motion.div 
             className="absolute top-0 left-0 h-full bg-black"
             style={{ width: `${count}%` }}
           />
        </div>
        <div className="mt-8 text-center font-mono text-xs text-gray-500 uppercase tracking-widest">
            {count < 30 && "Loading Modules..."}
            {count >= 30 && count < 70 && "Compiling Assets..."}
            {count >= 70 && count < 100 && "Establishing Uplink..."}
            {count === 100 && "System Ready"}
        </div>
      </div>
    </motion.div>
  );
};
