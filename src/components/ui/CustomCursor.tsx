import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [clicked, setClicked] = useState(false);
  const [hovering, setHovering] = useState(false);
  
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Initialize position off-screen or at 0,0
    const mouse = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    
    // Higher speed for snappier response (0.4 ~ 0.5 is good for responsive feel)
    const speed = 0.45; 
    let rafId: number;
    let isActive = false;

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      // If this is the first move, snap to position to avoid flying in from corner
      if (!isActive) {
        pos.x = e.clientX;
        pos.y = e.clientY;
        isActive = true;
      }

      const target = e.target as HTMLElement;
      
      const isClickable = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') || 
        target.closest('a') ||
        target.classList.contains('cursor-pointer') ||
        target.getAttribute('role') === 'button';
        
      setHovering(isClickable);
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);

    const animate = () => {
      // Linear Interpolation
      const dx = mouse.x - pos.x;
      const dy = mouse.y - pos.y;
      
      pos.x += dx * speed;
      pos.y += dy * speed;
      
      // Apply transform directly
      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`
        @media (pointer: fine) {
            body, a, button, [role="button"], input, select, textarea, .cursor-pointer {
                cursor: none !important;
            }
        }
      `}</style>
      <div 
        ref={cursorRef}
        className={`fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference hidden md:block will-change-transform
            bg-white rounded-full
            ${hovering ? 'w-12 h-12 -mt-6 -ml-6 opacity-100' : 'w-3 h-3 -mt-1.5 -ml-1.5 opacity-100'}
            ${clicked ? 'scale-75' : 'scale-100'}
        `}
        style={{
            // IMPORTANT: Only transition properties that are NOT being updated by JS loop
            transition: 'width 0.3s ease, height 0.3s ease, opacity 0.3s ease, transform 0s' 
        }}
      />
    </>
  );
};
