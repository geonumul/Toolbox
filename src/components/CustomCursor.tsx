import { useEffect, useRef, useState } from 'react';

export const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if ('ontouchstart' in window) return;

    const dot = dotRef.current;
    if (!dot) return;

    const onMouseMove = (e: MouseEvent) => {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest('a, button, [role="button"], input, textarea, select, label');
      setIsHovering(!!isClickable);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
    };
  }, []);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <div
      ref={dotRef}
      className="pointer-events-none fixed top-0 left-0 z-[9999] -translate-x-1/2 -translate-y-1/2"
      style={{ willChange: 'transform' }}
    >
      <div
        className="rounded-full bg-black transition-all duration-100"
        style={{
          width: isHovering ? '8px' : '5px',
          height: isHovering ? '8px' : '5px',
        }}
      />
    </div>
  );
};
