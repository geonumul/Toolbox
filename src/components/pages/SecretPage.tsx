import React, { useEffect, useRef, useState } from 'react';

// ──────────────────────── HAND LANDMARKS ────────────────────────
const THUMB_TIP = 4;
const INDEX_TIP = 8;

// ──────────────────────── GAME CONSTANTS ────────────────────────
const GAME_DURATION = 60_000;
const TRAIL_LIFETIME = 380;        // ms a trail point lives
const SLICE_VELOCITY = 2.5;        // px/frame minimum to slice (lowered from 5.5)
const SLICE_HIT_PADDING = 14;      // extra forgiving radius for slice detection
const PINCH_THRESHOLD = 0.55;
const SPAWN_INTERVAL_START = 1500;
const SPAWN_INTERVAL_END = 700;
const POINTS_ORB = 10;
const POINTS_CRYSTAL = 50;
const PENALTY_BOMB = -50;
const COMBO_MULT = (n: number) => Math.min(1 + n * 0.12, 4);
const BOMB_CHANCE = 0.06;          // was 0.10
const CRYSTAL_CHANCE = 0.12;       // was 0.08

type Phase = 'intro' | 'countdown' | 'playing' | 'gameover';
type ObjType = 'orb' | 'crystal' | 'bomb';

interface FlyingObj {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  spawnTime: number;
  rot: number; rotSpeed: number;
  type: ObjType;
  hue: number;
  r: number;
  sliced: boolean;
  slicedAt: number;
  sliceAngle: number;       // rad
  halves: Array<{ ox: number; oy: number; vx: number; vy: number; rot: number; rotSpeed: number }>;
  destroyed: boolean;
  caught: boolean;          // crystal absorbed
}

interface TrailPoint {
  x: number; y: number; t: number; hand: 0 | 1;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; hue: number; size: number; bomb: boolean;
}

interface FloatingText {
  x: number; y: number; text: string; life: number; color: string; size: number;
}

interface FlashEvent { t: number; kind: 'slice' | 'crystal' | 'bomb'; }

const loadScript = (src: string): Promise<void> =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res();
    s.onerror = rej;
    document.head.appendChild(s);
  });

export const SecretPage = ({ onExit }: { onExit: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'tracking' | 'error'>('loading');
  const [showExit, setShowExit] = useState(false);

  // ── Game state ──
  const phaseRef = useRef<Phase>('intro');
  const phaseStartRef = useRef(performance.now());
  const objectsRef = useRef<FlyingObj[]>([]);
  const trailsRef = useRef<TrailPoint[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const flashesRef = useRef<FlashEvent[]>([]);
  const lastSpawnRef = useRef(0);
  const objIdRef = useRef(1);
  const handsHeldRef = useRef(0);
  const countdownRef = useRef(3);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const totalSlicedRef = useRef(0);
  const totalCrystalsRef = useRef(0);
  const totalBombsRef = useRef(0);
  const displayScoreRef = useRef(0);
  const handPrevRef = useRef<Array<{ x: number; y: number } | null>>([null, null]);

  const [, setUiTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShowExit(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // ── MediaPipe + camera ──
  useEffect(() => {
    let animId: number;
    let stream: MediaStream | null = null;
    let hands: any = null;

    const init = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        const W = window as any;
        hands = new W.Hands({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.5 });
        hands.onResults((r: any) => {
          landmarksRef.current = r.multiHandLandmarks || [];
          if (landmarksRef.current.length > 0) setStatus('tracking');
          else if (status === 'tracking') setStatus('ready');
        });
        await hands.initialize();

        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('ready');

        const process = async () => {
          if (videoRef.current && hands) await hands.send({ image: videoRef.current });
          animId = requestAnimationFrame(process);
        };
        animId = requestAnimationFrame(process);
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    };
    init();
    return () => {
      cancelAnimationFrame(animId);
      stream?.getTracks().forEach(t => t.stop());
      hands?.close?.();
    };
  }, []);

  // ── Game / draw loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId: number;
    let lastT = performance.now();

    const spawnObject = (W: number, H: number) => {
      // Choose type
      const r = Math.random();
      let type: ObjType = 'orb';
      if (r < BOMB_CHANCE) type = 'bomb';
      else if (r < BOMB_CHANCE + CRYSTAL_CHANCE) type = 'crystal';

      // Pick a side (most from bottom, some from sides for variety)
      const sideRoll = Math.random();
      let x, y, vx, vy;
      const r0 = 32 + Math.random() * 14;             // bigger objects (was 26 + 14)
      const speedX = (Math.random() - 0.5) * 0.28;
      const upSpeed = -(0.7 + Math.random() * 0.4);   // slower (was -(0.95 + 0.55))
      if (sideRoll < 0.7) {
        x = 60 + Math.random() * (W - 120);
        y = H + 60;
        vx = speedX + (x < W / 2 ? 0.06 : -0.06);
        vy = upSpeed;
      } else if (sideRoll < 0.85) {
        x = -60;
        y = H * (0.4 + Math.random() * 0.5);
        vx = 0.5 + Math.random() * 0.22;              // slower
        vy = -0.3 - Math.random() * 0.22;
      } else {
        x = W + 60;
        y = H * (0.4 + Math.random() * 0.5);
        vx = -(0.5 + Math.random() * 0.22);
        vy = -0.3 - Math.random() * 0.22;
      }

      objectsRef.current.push({
        id: objIdRef.current++,
        x, y, vx, vy,
        spawnTime: performance.now(),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.06,
        type,
        hue: type === 'bomb' ? 0 : type === 'crystal' ? 48 : 180 + Math.random() * 180,
        r: r0,
        sliced: false,
        slicedAt: 0,
        sliceAngle: 0,
        halves: [],
        destroyed: false,
        caught: false,
      });
    };

    const burst = (x: number, y: number, hue: number, count: number, bomb: boolean) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 4;
        particlesRef.current.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 1, hue, size: 1.5 + Math.random() * 2.8, bomb,
        });
      }
    };

    const resetGame = () => {
      objectsRef.current = [];
      trailsRef.current = [];
      particlesRef.current = [];
      floatTextsRef.current = [];
      flashesRef.current = [];
      scoreRef.current = 0;
      displayScoreRef.current = 0;
      comboRef.current = 0;
      bestComboRef.current = 0;
      totalSlicedRef.current = 0;
      totalCrystalsRef.current = 0;
      totalBombsRef.current = 0;
      lastSpawnRef.current = 0;
      countdownRef.current = 3;
      handsHeldRef.current = 0;
      handPrevRef.current = [null, null];
    };

    const pushFloating = (x: number, y: number, text: string, color: string, size = 22) => {
      floatTextsRef.current.push({ x, y, text, life: 1, color, size });
    };
    const pushFlash = (kind: FlashEvent['kind']) => flashesRef.current.push({ t: 0, kind });

    // Test if a line segment from p0 to p1 intersects a circle (cx, cy, r)
    const segHitsCircle = (p0: { x: number; y: number }, p1: { x: number; y: number }, cx: number, cy: number, r: number) => {
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) {
        const ddx = cx - p0.x; const ddy = cy - p0.y;
        return ddx * ddx + ddy * ddy <= r * r;
      }
      const t = Math.max(0, Math.min(1, ((cx - p0.x) * dx + (cy - p0.y) * dy) / lenSq));
      const px = p0.x + t * dx;
      const py = p0.y + t * dy;
      const ddx = cx - px; const ddy = cy - py;
      return ddx * ddx + ddy * ddy <= r * r;
    };

    const draw = () => {
      const ctx = canvas.getContext('2d')!;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const now = performance.now();
      const dt = Math.min(50, now - lastT);
      lastT = now;

      const lms = landmarksRef.current;
      const video = videoRef.current;
      if (!video) { rafId = requestAnimationFrame(draw); return; }

      const vr = video.getBoundingClientRect();
      const toC = (lm: any) => ({ x: vr.left + (1 - lm.x) * vr.width, y: vr.top + lm.y * vr.height });

      // Hand info
      const hands: Array<{ tip: { x: number; y: number }; pinch: number } | null> = [null, null];
      for (let i = 0; i < Math.min(2, lms.length); i++) {
        const tip = toC(lms[i][INDEX_TIP]);
        const thumb = toC(lms[i][THUMB_TIP]);
        const maxPinchPx = 80;
        const pinch = Math.max(0, Math.min(1, 1 - Math.hypot(tip.x - thumb.x, tip.y - thumb.y) / maxPinchPx));
        hands[i] = { tip, pinch };
      }

      const phase = phaseRef.current;

      // ── Phase transitions ──
      if (phase === 'intro') {
        if (lms.length >= 1) handsHeldRef.current += dt; else handsHeldRef.current = 0;
        if (handsHeldRef.current > 800) {
          phaseRef.current = 'countdown';
          phaseStartRef.current = now;
          countdownRef.current = 3;
        }
      } else if (phase === 'countdown') {
        const elapsed = now - phaseStartRef.current;
        countdownRef.current = 3 - Math.floor(elapsed / 1000);
        if (elapsed > 3000) {
          resetGame();
          phaseRef.current = 'playing';
          phaseStartRef.current = now;
        }
      } else if (phase === 'playing') {
        if (now - phaseStartRef.current > GAME_DURATION) {
          phaseRef.current = 'gameover';
          phaseStartRef.current = now;
        }
      }

      // ── Trail update: drop new points, kill old ones ──
      if (phase === 'playing') {
        for (let i = 0; i < 2; i++) {
          const h = hands[i];
          if (h) trailsRef.current.push({ x: h.tip.x, y: h.tip.y, t: now, hand: i as 0 | 1 });
        }
      }
      trailsRef.current = trailsRef.current.filter(p => now - p.t < TRAIL_LIFETIME);

      // ── Spawn ──
      if (phase === 'playing') {
        const elapsed = now - phaseStartRef.current;
        const t = Math.min(1, elapsed / GAME_DURATION);
        const spawnInterval = SPAWN_INTERVAL_START * (1 - t) + SPAWN_INTERVAL_END * t;
        if (now - lastSpawnRef.current > spawnInterval) {
          spawnObject(W, H);
          // Occasional pair spawn for variety (rarer + further apart)
          if (Math.random() < 0.10) setTimeout(() => spawnObject(W, H), 220);
          lastSpawnRef.current = now;
        }
      }

      // ── Update objects (gravity, rotation, slicing) ──
      const gravity = 0.0013; // px per ms² (was 0.0019)
      const surviving: FlyingObj[] = [];
      for (const obj of objectsRef.current) {
        if (obj.sliced) {
          // Animate halves
          const lifeT = (now - obj.slicedAt) / 800;
          if (lifeT < 1) {
            for (const half of obj.halves) {
              half.ox += half.vx * dt;
              half.oy += half.vy * dt;
              half.vy += gravity * dt;
              half.rot += half.rotSpeed * dt;
            }
            surviving.push(obj);
          }
          continue;
        }

        // Move + gravity
        obj.x += obj.vx * dt;
        obj.y += obj.vy * dt;
        obj.vy += gravity * dt;
        obj.rot += obj.rotSpeed * dt;

        // Cull off-screen (below). No combo penalty on miss — players keep
        // their streak as long as they don't slice bombs or pinch wrong.
        if (obj.y > H + 120) continue;

        // Slice detection (only during playing, only orbs and bombs sliceable)
        if (phase === 'playing' && (obj.type === 'orb' || obj.type === 'bomb')) {
          for (let i = 0; i < 2; i++) {
            const h = hands[i];
            const prev = handPrevRef.current[i];
            if (h && prev) {
              const dx = h.tip.x - prev.x;
              const dy = h.tip.y - prev.y;
              const speed = Math.hypot(dx, dy);
              if (speed > SLICE_VELOCITY) {
                if (segHitsCircle(prev, h.tip, obj.x, obj.y, obj.r + SLICE_HIT_PADDING)) {
                  obj.sliced = true;
                  obj.slicedAt = now;
                  obj.sliceAngle = Math.atan2(dy, dx);
                  // Two halves drift apart perpendicular to the cut
                  const perp = obj.sliceAngle + Math.PI / 2;
                  const sp = 0.18 + Math.random() * 0.1;
                  obj.halves = [
                    { ox: 0, oy: 0, vx: Math.cos(perp) * sp, vy: Math.sin(perp) * sp - 0.05, rot: 0, rotSpeed: 0.005 + Math.random() * 0.003 },
                    { ox: 0, oy: 0, vx: -Math.cos(perp) * sp, vy: -Math.sin(perp) * sp - 0.05, rot: 0, rotSpeed: -(0.005 + Math.random() * 0.003) },
                  ];
                  if (obj.type === 'orb') {
                    comboRef.current += 1;
                    bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
                    const gain = Math.round(POINTS_ORB * COMBO_MULT(comboRef.current - 1));
                    scoreRef.current += gain;
                    totalSlicedRef.current += 1;
                    burst(obj.x, obj.y, obj.hue, 18, false);
                    pushFloating(obj.x, obj.y - 14, `+${gain}`, `hsla(${obj.hue},95%,75%,1)`, 22);
                    if (comboRef.current > 1) pushFloating(obj.x, obj.y - 38, `×${comboRef.current}`, 'rgba(180,255,220,0.95)', 16);
                    pushFlash('slice');
                  } else {
                    // Bomb sliced — penalty
                    comboRef.current = 0;
                    scoreRef.current = Math.max(0, scoreRef.current + PENALTY_BOMB);
                    totalBombsRef.current += 1;
                    burst(obj.x, obj.y, 0, 30, true);
                    pushFloating(obj.x, obj.y - 14, `${PENALTY_BOMB}`, 'rgba(255,90,120,1)', 24);
                    pushFloating(obj.x, obj.y - 40, 'BOMB', 'rgba(255,140,160,1)', 14);
                    pushFlash('bomb');
                  }
                  break;
                }
              }
            }
          }
        }

        // Crystal pinch absorption
        if (phase === 'playing' && obj.type === 'crystal' && !obj.sliced) {
          for (let i = 0; i < 2; i++) {
            const h = hands[i];
            if (h && h.pinch > PINCH_THRESHOLD) {
              const d = Math.hypot(h.tip.x - obj.x, h.tip.y - obj.y);
              if (d < obj.r + 22) {
                obj.sliced = true;
                obj.slicedAt = now;
                obj.caught = true;
                obj.halves = [];
                comboRef.current += 1;
                bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
                const gain = Math.round(POINTS_CRYSTAL * COMBO_MULT(comboRef.current - 1));
                scoreRef.current += gain;
                totalCrystalsRef.current += 1;
                burst(obj.x, obj.y, 48, 26, false);
                pushFloating(obj.x, obj.y - 14, `+${gain}`, 'rgba(255,220,140,1)', 26);
                pushFloating(obj.x, obj.y - 42, 'CRYSTAL', 'rgba(255,230,170,0.95)', 13);
                if (comboRef.current > 1) pushFloating(obj.x, obj.y - 64, `×${comboRef.current}`, 'rgba(255,210,170,0.95)', 16);
                pushFlash('crystal');
                break;
              }
            }
          }
        }

        surviving.push(obj);
      }
      objectsRef.current = surviving;

      // ── Particles ──
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.03;
        p.life -= dt / 700;
        return p.life > 0;
      });

      // ── DRAW ──

      // Trails — glowing glass ribbons
      for (let handIdx = 0; handIdx < 2; handIdx++) {
        const pts = trailsRef.current.filter(p => p.hand === handIdx);
        if (pts.length < 2) continue;
        for (let pass = 0; pass < 2; pass++) {
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = 'rgba(180,220,255,0.95)';
          ctx.shadowBlur = pass === 0 ? 22 : 6;
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1];
            const b = pts[i];
            const age = (now - b.t) / TRAIL_LIFETIME;
            const alpha = Math.max(0, 1 - age);
            ctx.strokeStyle = pass === 0
              ? `rgba(180,220,255,${alpha * 0.55})`
              : `rgba(255,255,255,${alpha * 0.95})`;
            ctx.lineWidth = pass === 0 ? 14 * alpha + 2 : 2.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Particles
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.bomb
          ? `rgba(255,${100 + 80 * p.life},${110 + 60 * p.life},${p.life})`
          : `hsla(${p.hue}, 90%, ${65 + 15 * p.life}%, ${p.life})`;
        ctx.shadowColor = p.bomb ? 'rgba(255,80,100,0.9)' : `hsla(${p.hue}, 100%, 70%, 0.9)`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Objects
      for (const obj of objectsRef.current) {
        if (obj.sliced) {
          // Two halves flying apart
          const lifeT = (now - obj.slicedAt) / 800;
          const alpha = Math.max(0, 1 - lifeT);
          if (obj.caught) {
            // Crystal: simple shrink-collapse
            ctx.save();
            ctx.globalAlpha = alpha;
            const r = obj.r * (1 + lifeT * 0.6);
            ctx.shadowColor = 'rgba(255,220,140,0.95)';
            ctx.shadowBlur = 30;
            ctx.fillStyle = `rgba(255,230,170,${alpha * 0.7})`;
            ctx.beginPath(); ctx.arc(obj.x, obj.y, r, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          } else {
            for (let h = 0; h < obj.halves.length; h++) {
              const half = obj.halves[h];
              const cx = obj.x + half.ox;
              const cy = obj.y + half.oy;
              const r = obj.r;
              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.translate(cx, cy);
              ctx.rotate(obj.sliceAngle + half.rot);
              const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
              if (obj.type === 'bomb') {
                ctx.shadowColor = 'rgba(255,90,90,0.9)';
                ctx.shadowBlur = 24;
                grad.addColorStop(0, 'rgba(255,160,160,0.85)');
                grad.addColorStop(0.6, 'rgba(180,30,40,0.55)');
                grad.addColorStop(1, 'rgba(60,0,0,0)');
              } else {
                ctx.shadowColor = `hsla(${obj.hue},100%,70%,0.9)`;
                ctx.shadowBlur = 22;
                grad.addColorStop(0, `hsla(${obj.hue},95%,85%,0.9)`);
                grad.addColorStop(0.55, `hsla(${obj.hue},90%,60%,0.55)`);
                grad.addColorStop(1, `hsla(${obj.hue},80%,40%,0)`);
              }
              ctx.fillStyle = grad;
              // Half-circle
              ctx.beginPath();
              if (h === 0) ctx.arc(0, 0, r, 0, Math.PI);
              else ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
              ctx.closePath();
              ctx.fill();
              // Cut edge highlight
              ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
              ctx.stroke();
              ctx.restore();
            }
          }
          continue;
        }

        // Whole object
        const ageIn = Math.min(1, (now - obj.spawnTime) / 220);
        ctx.save();
        ctx.globalAlpha = ageIn;
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rot);

        if (obj.type === 'bomb') {
          // Pulsing red bomb with spikes
          const pulse = 0.5 + 0.5 * Math.sin((now - obj.spawnTime) / 140);
          ctx.shadowColor = 'rgba(255,80,100,0.95)';
          ctx.shadowBlur = 30 + pulse * 20;
          // Outer halo
          ctx.strokeStyle = `rgba(255,80,100,${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, obj.r + 6 + pulse * 8, 0, Math.PI * 2);
          ctx.stroke();
          // Body
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, obj.r);
          grad.addColorStop(0, 'rgba(255,180,180,0.95)');
          grad.addColorStop(0.55, 'rgba(220,40,60,0.7)');
          grad.addColorStop(1, 'rgba(60,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(0, 0, obj.r, 0, Math.PI * 2); ctx.fill();
          // Warning ✕
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 2.5;
          const k = obj.r * 0.45;
          ctx.beginPath();
          ctx.moveTo(-k, -k); ctx.lineTo(k, k);
          ctx.moveTo(k, -k); ctx.lineTo(-k, k);
          ctx.stroke();
        } else if (obj.type === 'crystal') {
          // Golden faceted gem (rotating diamond polygon)
          const pulse = 0.5 + 0.5 * Math.sin((now - obj.spawnTime) / 200);
          ctx.shadowColor = 'rgba(255,220,140,0.95)';
          ctx.shadowBlur = 30 + pulse * 14;
          // Outer ring (signals "needs pinch")
          ctx.strokeStyle = `rgba(255,220,140,${0.55 + pulse * 0.35})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath(); ctx.arc(0, 0, obj.r + 10, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          // Diamond
          const grad = ctx.createLinearGradient(0, -obj.r, 0, obj.r);
          grad.addColorStop(0, 'rgba(255,255,210,0.95)');
          grad.addColorStop(0.5, 'rgba(255,200,90,0.85)');
          grad.addColorStop(1, 'rgba(180,120,40,0.6)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, -obj.r);
          ctx.lineTo(obj.r * 0.7, 0);
          ctx.lineTo(0, obj.r);
          ctx.lineTo(-obj.r * 0.7, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,240,200,0.9)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Standard glass orb
          ctx.shadowColor = `hsla(${obj.hue},100%,70%,0.9)`;
          ctx.shadowBlur = 26;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, obj.r);
          grad.addColorStop(0, `hsla(${obj.hue},95%,85%,0.92)`);
          grad.addColorStop(0.55, `hsla(${obj.hue},90%,60%,0.6)`);
          grad.addColorStop(1, `hsla(${obj.hue},80%,40%,0)`);
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(0, 0, obj.r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.arc(-obj.r * 0.32, -obj.r * 0.34, obj.r * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Hand markers
      for (let i = 0; i < 2; i++) {
        const h = hands[i];
        if (!h) continue;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 14 + h.pinch * 18;
        ctx.beginPath();
        ctx.arc(h.tip.x, h.tip.y, 5 + h.pinch * 4, 0, Math.PI * 2);
        ctx.fill();
        if (h.pinch > PINCH_THRESHOLD) {
          ctx.strokeStyle = 'rgba(255,220,140,0.95)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(h.tip.x, h.tip.y, 22, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Floating texts
      floatTextsRef.current = floatTextsRef.current.filter(ft => {
        ft.life -= dt / 900;
        ft.y -= dt * 0.06;
        return ft.life > 0;
      });
      for (const ft of floatTextsRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.font = `900 ${ft.size}px 'Pretendard Variable', Pretendard, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 18;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // Edge flashes
      flashesRef.current = flashesRef.current.filter(f => { f.t += dt / 350; return f.t < 1; });
      for (const f of flashesRef.current) {
        const alpha = (1 - f.t) * 0.4;
        const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
        const color = f.kind === 'slice'
          ? `rgba(180,220,255,${alpha})`
          : f.kind === 'crystal'
          ? `rgba(255,220,140,${alpha})`
          : `rgba(255,80,100,${alpha + 0.15})`;
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, color);
        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // Combo glow when ≥3
      if (phase === 'playing' && comboRef.current >= 3) {
        const intensity = Math.min(1, (comboRef.current - 2) / 8);
        const pulse = 0.5 + 0.5 * Math.sin(now / 280);
        const a = (0.08 + 0.18 * intensity) * (0.7 + 0.3 * pulse);
        const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.7);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(180,220,255,${a})`);
        ctx.save(); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H); ctx.restore();
      }

      // Vignette
      const vGrad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.85);
      vGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.save(); ctx.fillStyle = vGrad; ctx.fillRect(0, 0, W, H); ctx.restore();

      // Tween display score
      displayScoreRef.current += (scoreRef.current - displayScoreRef.current) * Math.min(1, dt / 220);

      // Capture hand positions for next frame's slice detection
      handPrevRef.current = [
        hands[0] ? { x: hands[0].tip.x, y: hands[0].tip.y } : null,
        hands[1] ? { x: hands[1].tip.x, y: hands[1].tip.y } : null,
      ];

      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    const ui = setInterval(() => setUiTick(n => n + 1), 100);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      clearInterval(ui);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  const handleRetry = () => {
    phaseRef.current = 'intro';
    phaseStartRef.current = performance.now();
    handsHeldRef.current = 0;
  };

  const phase = phaseRef.current;
  const elapsed = phase === 'playing' ? performance.now() - phaseStartRef.current : 0;
  const timeLeft = phase === 'playing' ? Math.max(0, GAME_DURATION - elapsed) : GAME_DURATION;
  const score = scoreRef.current;
  const displayScore = Math.round(displayScoreRef.current);
  const combo = comboRef.current;
  const bestCombo = bestComboRef.current;
  const sliced = totalSlicedRef.current;
  const crystals = totalCrystalsRef.current;
  const bombs = totalBombsRef.current;

  const grade =
    score >= 1500 ? { letter: 'S', tag: 'LEGENDARY', color: 'rgba(255,220,140,1)' }
    : score >= 1000 ? { letter: 'A', tag: 'EXCELLENT', color: 'rgba(180,255,220,1)' }
    : score >= 650 ? { letter: 'B', tag: 'NICE', color: 'rgba(180,200,255,1)' }
    : score >= 300 ? { letter: 'C', tag: 'OK', color: 'rgba(255,255,255,0.85)' }
    : { letter: 'D', tag: 'KEEP TRYING', color: 'rgba(255,180,180,0.85)' };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="fixed inset-0 overflow-hidden z-[9999]" style={{ background: 'linear-gradient(135deg, #08080f 0%, #0e0e1a 50%, #08080f 100%)' }}>
      {/* Backdrop blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '5%', left: '2%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,160,255,0.32), transparent 70%)', filter: 'blur(55px)' }} />
        <div style={{ position: 'absolute', bottom: '4%', right: '4%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,140,180,0.26), transparent 70%)', filter: 'blur(65px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(80,255,200,0.22), transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.06 }}>
        <defs>
          <pattern id="sg2" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sg2)" />
      </svg>

      {/* Camera sized to the largest 4:3 rectangle that fits in the viewport
          (with a small margin). Aspect-locked so the visible video matches
          1:1 with the hand-mapping rect — no zoom-crop, no dead space. */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(94vw, calc(88vh * 4 / 3))',
          aspectRatio: '4 / 3',
          opacity: 0.13,
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)', display: 'block' }}
          muted playsInline autoPlay
        />
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* HUD: Score / Combo */}
      <div className="absolute" style={{ top: 24, left: 28, display: 'flex', flexDirection: 'column', gap: 8, width: 200 }}>
        <button
          onClick={onExit}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.22)',
            backdropFilter: 'blur(12px)',
            borderRadius: 6, padding: '8px 14px',
            color: 'rgba(255,255,255,0.85)', fontSize: 10,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.3s',
            opacity: showExit ? 1 : 0,
            pointerEvents: showExit ? 'auto' : 'none',
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          }}
        >
          ← TOOLBOX
        </button>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>SCORE</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,0.95)', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {displayScore.toLocaleString()}
          </div>
          <div style={{ marginTop: 12, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
            <span>COMBO</span>
            <span style={{ color: combo > 0 ? 'rgba(180,220,255,0.95)' : 'rgba(255,255,255,0.45)' }}>×{combo}</span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
            <span>BEST</span>
            <span>×{bestCombo}</span>
          </div>
        </div>
      </div>

      {/* HUD: Title + Timer + How */}
      <div className="absolute" style={{ top: 24, right: 28, display: 'flex', flexDirection: 'column', gap: 8, width: 232 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>TOOLBOX /// SECRET</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.94)', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", letterSpacing: '-0.04em' }}>GLASS BLADE</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginTop: 2, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>{timeStr}</div>
        </div>

        {phase === 'playing' && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>TIME LEFT</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: timeLeft < 10000 ? 'rgba(255,140,140,0.95)' : 'rgba(255,255,255,0.95)', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {(timeLeft / 1000).toFixed(1)}s
            </div>
            <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(timeLeft / GAME_DURATION) * 100}%`,
                background: timeLeft < 10000
                  ? 'linear-gradient(90deg, rgba(255,80,80,0.9), rgba(255,160,160,0.9))'
                  : 'linear-gradient(90deg, rgba(180,220,255,0.95), rgba(220,200,255,0.95))',
                transition: 'width 0.1s linear',
              }} />
            </div>
          </div>
        )}

        <div className="pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>HOW TO PLAY</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, letterSpacing: '0.05em', fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
            <span style={{ color: 'rgba(180,220,255,0.95)' }}>● ORB</span> · 손끝으로 빠르게 베기 (+10)<br />
            <span style={{ color: 'rgba(255,220,140,0.95)' }}>◆ CRYSTAL</span> · 손가락 핀치로 흡수 (+50)<br />
            <span style={{ color: 'rgba(255,120,140,0.95)' }}>✕ BOMB</span> · 절대 베지 마세요 (-50)
          </div>
        </div>
      </div>

      {phase === 'intro' && (
        <div className="absolute pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: '90%', maxWidth: 540 }}>
          <div style={{
            background: 'rgba(15,15,24,0.6)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(22px)',
            borderRadius: 18,
            padding: '38px 44px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 14, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>READY</div>
            <h1 style={{ fontSize: 60, fontWeight: 900, color: 'white', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 14, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>GLASS BLADE</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.05em', lineHeight: 1.7, marginBottom: 22, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
              검지 손가락이 글래스 칼날이 됩니다.<br />
              날아오는 오브를 빠르게 가르고, 폭탄은 피하세요.<br />
              한 손이라도 카메라에 보이면 시작합니다.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '10px 18px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 999,
              fontSize: 10,
              color: lms_count(landmarksRef.current) >= 1 ? 'rgba(180,220,255,0.95)' : 'rgba(255,255,255,0.55)',
              letterSpacing: '0.3em', textTransform: 'uppercase',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            }}>
              {status === 'loading' ? 'INITIALIZING CAMERA…'
                : status === 'error' ? 'CAMERA ERROR'
                : `HAND DETECTED · ${lms_count(landmarksRef.current)}/2`}
            </div>
          </div>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="absolute pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div
            key={countdownRef.current}
            style={{
              fontSize: countdownRef.current > 0 ? 220 : 140,
              fontWeight: 900, color: 'white', letterSpacing: '-0.05em',
              textShadow: '0 0 80px rgba(255,255,255,0.7), 0 0 160px rgba(180,220,255,0.3)',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif", lineHeight: 1,
              animation: 'cdpop 1s ease-out',
            }}
          >
            {countdownRef.current > 0 ? countdownRef.current : 'SLICE!'}
          </div>
          <style>{`
            @keyframes cdpop {
              0% { transform: scale(0.4); opacity: 0; }
              35% { transform: scale(1.15); opacity: 1; }
              70% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0.95); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: '92%', maxWidth: 560 }}>
          <div style={{
            background: 'rgba(15,15,24,0.7)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(24px)',
            borderRadius: 20,
            padding: '40px 48px',
            boxShadow: '0 30px 100px rgba(0,0,0,0.6), 0 0 80px rgba(120,160,255,0.05) inset',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>TIME UP — RESULT</div>
            <div style={{
              display: 'inline-block', padding: '4px 28px',
              fontSize: 140, fontWeight: 900, color: grade.color,
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              lineHeight: 1, letterSpacing: '-0.06em',
              textShadow: `0 0 60px ${grade.color}`,
              marginTop: 4, marginBottom: 4,
            }}>{grade.letter}</div>
            <div style={{ fontSize: 11, color: grade.color, letterSpacing: '0.45em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 22, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>{grade.tag}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 28, paddingTop: 18, paddingBottom: 18, borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <Stat label="SCORE" value={score.toLocaleString()} highlight />
              <Stat label="BEST COMBO" value={`×${bestCombo}`} />
              <Stat label="SLICED · CRYSTAL · BOMB" value={`${sliced} · ${crystals} · ${bombs}`} />
            </div>

            <button onClick={handleRetry} style={{
              background: 'rgba(255,255,255,0.96)', color: '#000',
              border: 'none', borderRadius: 999, padding: '14px 38px',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              marginRight: 10, boxShadow: '0 8px 30px rgba(255,255,255,0.15)',
            }}>↺ Retry</button>
            <button onClick={onExit} style={{
              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999,
              padding: '14px 28px', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.4em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            }}>Exit</button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="absolute pointer-events-none" style={{ bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', borderRadius: 999, padding: '8px 22px', color: 'rgba(255,255,255,0.55)', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
            ESC TO EXIT
          </div>
        </div>
      )}
    </div>
  );
};

const lms_count = (lms: any[]) => Math.min(2, lms.length);

const Stat = ({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>{label}</div>
    <div style={{
      fontSize: highlight ? 26 : 18,
      fontWeight: 900,
      color: highlight ? 'white' : 'rgba(255,255,255,0.9)',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
    }}>{value}</div>
  </div>
);
