import React from 'react';
import { motion } from 'motion/react';
import { useLang } from '../contexts/LangContext';

export const Marquee = () => {
  const { t } = useLang();
  return (
    <div className="bg-black text-white py-6 md:py-8 overflow-hidden">
      <div className="flex whitespace-nowrap">
        <motion.div
          className="flex gap-8 md:gap-16 text-5xl md:text-8xl font-black tracking-tighter items-center"
          animate={{ x: "-50%" }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {Array(4).fill(t.marquee.text).map((text, i) => (
            <span key={i} className="flex items-center gap-16">
               {text}
               <span className="w-8 h-8 bg-white rounded-full" />
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
