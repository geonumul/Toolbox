import React, { useEffect, useRef, useState, useCallback } from "react";

const CELL = 20;
const COLS = 24;
const ROWS = 20;
const W = COLS * CELL;
const H = ROWS * CELL;

type Point = { x: number; y: number };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

const randomFood = (snake: Point[]): Point => {
  let p: Point;
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === p.x && s.y === p.y));
  return p;
};

export const SecretPage = ({ onExit }: { onExit: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }],
    dir: "RIGHT" as Dir,
    nextDir: "RIGHT" as Dir,
    food: { x: 18, y: 10 },
    score: 0,
    best: parseInt(localStorage.getItem("snake_best") || "0"),
    alive: false,
    started: false,
    speed: 120,
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [displayBest, setDisplayBest] = useState(parseInt(localStorage.getItem("snake_best") || "0"));
  const [status, setStatus] = useState<"idle" | "playing" | "dead">("idle");
  const rafRef = useRef<number>();
  const lastTickRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke();
    }
    for (let j = 0; j <= ROWS; j++) {
      ctx.beginPath(); ctx.moveTo(0, j * CELL); ctx.lineTo(W, j * CELL); ctx.stroke();
    }

    // food — pulsing dot
    const t = Date.now() / 400;
    const pulse = 0.7 + 0.3 * Math.sin(t);
    ctx.fillStyle = `rgba(255,255,255,${pulse})`;
    const fx = s.food.x * CELL + CELL / 2;
    const fy = s.food.y * CELL + CELL / 2;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();

    // snake
    s.snake.forEach((seg, i) => {
      const alpha = i === 0 ? 1 : Math.max(0.25, 1 - i / s.snake.length * 0.6);
      ctx.fillStyle = i === 0 ? "#ffffff" : `rgba(255,255,255,${alpha})`;
      const pad = i === 0 ? 1 : 3;
      ctx.fillRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);

      if (i === 0) {
        // eyes
        const ex = seg.x * CELL;
        const ey = seg.y * CELL;
        ctx.fillStyle = "#0a0a0a";
        const d = s.dir;
        const eyes: Point[] = d === "RIGHT" ? [{ x: ex + 14, y: ey + 5 }, { x: ex + 14, y: ey + 13 }]
          : d === "LEFT" ? [{ x: ex + 4, y: ey + 5 }, { x: ex + 4, y: ey + 13 }]
          : d === "UP" ? [{ x: ex + 5, y: ey + 4 }, { x: ex + 13, y: ey + 4 }]
          : [{ x: ex + 5, y: ey + 14 }, { x: ex + 13, y: ey + 14 }];
        eyes.forEach(e => { ctx.beginPath(); ctx.arc(e.x, e.y, 2, 0, Math.PI * 2); ctx.fill(); });
      }
    });
  }, []);

  const tick = useCallback((ts: number) => {
    const s = stateRef.current;
    if (!s.alive) { draw(); return; }

    draw();

    if (ts - lastTickRef.current < s.speed) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    lastTickRef.current = ts;

    s.dir = s.nextDir;
    const head = s.snake[0];
    const next: Point = {
      x: (head.x + (s.dir === "RIGHT" ? 1 : s.dir === "LEFT" ? -1 : 0) + COLS) % COLS,
      y: (head.y + (s.dir === "DOWN" ? 1 : s.dir === "UP" ? -1 : 0) + ROWS) % ROWS,
    };

    const hitSelf = s.snake.slice(1).some(seg => seg.x === next.x && seg.y === next.y);
    if (hitSelf) {
      s.alive = false;
      s.started = false;
      if (s.score > s.best) {
        s.best = s.score;
        localStorage.setItem("snake_best", String(s.best));
        setDisplayBest(s.best);
      }
      setStatus("dead");
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const ate = next.x === s.food.x && next.y === s.food.y;
    s.snake = [next, ...s.snake];
    if (!ate) s.snake.pop();
    else {
      s.score += 10;
      s.food = randomFood(s.snake);
      s.speed = Math.max(60, s.speed - 2);
      setDisplayScore(s.score);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.snake = [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }];
    s.dir = "RIGHT";
    s.nextDir = "RIGHT";
    s.food = randomFood(s.snake);
    s.score = 0;
    s.speed = 120;
    s.alive = true;
    s.started = true;
    setDisplayScore(0);
    setStatus("playing");
    lastTickRef.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "Escape") { onExit(); return; }
      if ((e.key === " " || e.key === "Enter") && !s.alive) { startGame(); return; }
      const map: Record<string, Dir> = {
        ArrowUp: "UP", w: "UP", W: "UP",
        ArrowDown: "DOWN", s: "DOWN", S: "DOWN",
        ArrowLeft: "LEFT", a: "LEFT", A: "LEFT",
        ArrowRight: "RIGHT", d: "RIGHT", D: "RIGHT",
      };
      const newDir = map[e.key];
      if (!newDir) return;
      const opp = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
      if (s.dir !== opp[newDir]) s.nextDir = newDir;
      if (!s.alive && !s.started) startGame();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [startGame, onExit]);

  const handleSwipe = (() => {
    let sx = 0, sy = 0;
    return {
      start: (e: React.TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; },
      end: (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        const s = stateRef.current;
        const opp = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" } as Record<Dir, Dir>;
        let newDir: Dir | null = null;
        if (Math.abs(dx) > Math.abs(dy)) newDir = dx > 0 ? "RIGHT" : "LEFT";
        else newDir = dy > 0 ? "DOWN" : "UP";
        if (newDir && s.dir !== opp[newDir]) s.nextDir = newDir;
        if (!s.alive) startGame();
      }
    };
  })();

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-8">
        <button
          onClick={onExit}
          className="text-white/30 hover:text-white text-[10px] font-bold tracking-[0.3em] uppercase transition-colors"
        >
          ← TOOLBOX
        </button>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-white/30 text-[8px] font-bold tracking-[0.2em] uppercase">Score</p>
            <p className="text-white font-black text-xl tracking-tight">{displayScore}</p>
          </div>
          <div>
            <p className="text-white/30 text-[8px] font-bold tracking-[0.2em] uppercase">Best</p>
            <p className="text-white/60 font-black text-xl tracking-tight">{displayBest}</p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ width: W, height: H }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="border border-white/10"
          onTouchStart={handleSwipe.start}
          onTouchEnd={handleSwipe.end}
        />

        {/* Overlay messages */}
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="text-white font-black text-4xl tracking-tighter mb-2">SNAKE</p>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mb-8">A TOOLBOX SECRET</p>
            <p className="text-white/60 text-xs tracking-widest uppercase animate-pulse">Press SPACE or tap to start</p>
            <p className="text-white/30 text-[10px] mt-3 tracking-wider">WASD / Arrow keys to move</p>
          </div>
        )}

        {status === "dead" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <p className="text-white font-black text-3xl tracking-tighter mb-1">GAME OVER</p>
            <p className="text-white/50 text-sm mb-1">Score: <span className="text-white font-bold">{displayScore}</span></p>
            {displayScore >= displayBest && displayScore > 0 && (
              <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase mb-6">NEW BEST!</p>
            )}
            <p className="text-white/40 text-[10px] mt-6 tracking-widest uppercase animate-pulse">Press SPACE to retry</p>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="mt-6 grid grid-cols-3 gap-2 md:hidden">
        {[
          [null, { label: "↑", dir: "UP" as Dir }, null],
          [{ label: "←", dir: "LEFT" as Dir }, { label: "↓", dir: "DOWN" as Dir }, { label: "→", dir: "RIGHT" as Dir }],
        ].map((row, ri) => (
          <React.Fragment key={ri}>
            {row.map((btn, ci) =>
              btn ? (
                <button
                  key={ci}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const s = stateRef.current;
                    const opp = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" } as Record<Dir, Dir>;
                    if (s.dir !== opp[btn.dir]) s.nextDir = btn.dir;
                    if (!s.alive) startGame();
                  }}
                  className="w-12 h-12 bg-white/10 rounded flex items-center justify-center text-white font-bold active:bg-white/30"
                >
                  {btn.label}
                </button>
              ) : <div key={ci} className="w-12 h-12" />
            )}
          </React.Fragment>
        ))}
      </div>

      <p className="absolute bottom-6 text-white/20 text-[9px] tracking-[0.3em] uppercase">ESC to exit</p>
    </div>
  );
};
