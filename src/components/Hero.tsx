import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';

export const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000, radius: 100 };

    class Particle {
      x: number;
      y: number;
      originX: number;
      originY: number;
      size: number;
      vx: number;
      vy: number;
      friction: number;
      ease: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.size = Math.random() * 1.5 + 0.5;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.9;
        this.ease = 0.1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
           const angle = Math.atan2(dy, dx);
           const force = (mouse.radius - distance) / mouse.radius;
           const pushX = Math.cos(angle) * force * 50; 
           const pushY = Math.sin(angle) * force * 50;
           
           this.vx -= pushX;
           this.vy -= pushY;
        }

        this.vx += (this.originX - this.x) * this.ease;
        this.vy += (this.originY - this.y) * this.ease;
        
        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx;
        this.y += this.vy;

        this.draw();
      }
    }

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      particles = [];

      const gap = width < 768 ? 40 : 25;
      
      for (let y = 0; y < height; y += gap) {
        for (let x = 0; x < width; x += gap) {
           particles.push(new Particle(x, y));
        }
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height); 
      
      particles.forEach(particle => particle.update());
      requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleMouseMove = (e: MouseEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };
    
    const handleResize = () => {
        init();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section className="relative h-screen w-full bg-white overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      <div className="relative z-10 pointer-events-none mix-blend-difference px-6 text-center text-white">
         <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
         >
             <h1 className="text-[18vw] md:text-[13vw] font-bold leading-none tracking-tighter mb-6 md:mb-8 select-none">
                TOOLBOX
             </h1>
             <div className="h-px w-full bg-white mt-4 mb-6 opacity-50" />
             <div className="flex justify-between items-start font-mono text-xs md:text-xs uppercase tracking-widest opacity-80">
                 <div className="text-left leading-tight">
                    CUK Spatial Design<br/>
                    Est. 2025
                 </div>
                 <div className="text-right leading-tight">
                    Creative Collective<br/>
                    Space / Code / Art
                 </div>
             </div>
         </motion.div>
      </div>
      
      <motion.div 
         className="absolute bottom-10 left-1/2 -translate-x-1/2 text-black"
         animate={{ y: [0, 10, 0] }}
         transition={{ duration: 2, repeat: Infinity }}
      >
         <ArrowDown size={20} strokeWidth={1.5} />
      </motion.div>
    </section>
  );
};
