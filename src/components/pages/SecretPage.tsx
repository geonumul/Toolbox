import React, { useEffect, useRef, useState } from 'react';

// ──────────────────────── HAND LANDMARKS ────────────────────────
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const PALM = 9;

// ──────────────────────── GAME CONSTANTS ────────────────────────
const GAME_DURATION = 60_000;
const ORB_SPAWN_INTERVAL_START = 1400;
const ORB_SPAWN_INTERVAL_END = 600;
const CAPTURE_THRESHOLD_MS = 550;
const PINCH_THRESHOLD = 0.65;
const SHADOW_CHANCE = 0.22;
const MAX_ORBS = 9;
const POINTS_NORMAL = 10;
const POINTS_SHADOW = 25;
const COMBO_MULT = (n: number) => Math.min(1 + n * 0.15, 5);

type Phase = 'intro' | 'countdown' | 'playing' | 'gameover';

interface Orb {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  hue: number;
  shadow: boolean;
  age: number;
  inGlassFor: number;
  dying: boolean;
  dyingT: number;
  destroyedBy: 'glass' | 'pinch' | null;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  hue: number;
  shadow: boolean;
  size: number;
}

interface FloatingText {
  x: number; y: number;
  text: string;
  life: number;
  color: string;
  size: number;
}

interface FlashEvent {
  t: number; // 0..1 lifetime
  kind: 'capture' | 'shatter' | 'penalty';
}

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

  // ── Game state (refs so the rAF loop reads fresh values) ──
  const phaseRef = useRef<Phase>('intro');
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const orbsRef = useRef<Orb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const flashesRef = useRef<FlashEvent[]>([]);
  const phaseStartRef = useRef(performance.now());
  const lastSpawnRef = useRef(0);
  const orbIdRef = useRef(1);
  const handsHeldRef = useRef(0);
  const countdownRef = useRef(3);
  const totalCapturesRef = useRef(0);
  const totalShattersRef = useRef(0);
  const displayScoreRef = useRef(0);

  // Mirror to React state for HUD redraws
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

    const spawnOrb = (W: number, H: number) => {
      const margin = 80;
      const r = 22 + Math.random() * 16;
      const shadow = Math.random() < SHADOW_CHANCE;
      // Spawn just inside the screen, drifting toward the centre
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0, vx = 0, vy = 0;
      const speed = 0.04 + Math.random() * 0.05;
      if (side === 0) { x = margin; y = margin + Math.random() * (H - margin * 2); vx = speed; vy = (Math.random() - 0.5) * 0.04; }
      else if (side === 1) { x = W - margin; y = margin + Math.random() * (H - margin * 2); vx = -speed; vy = (Math.random() - 0.5) * 0.04; }
      else if (side === 2) { x = margin + Math.random() * (W - margin * 2); y = margin; vx = (Math.random() - 0.5) * 0.04; vy = speed; }
      else { x = margin + Math.random() * (W - margin * 2); y = H - margin; vx = (Math.random() - 0.5) * 0.04; vy = -speed; }
      orbsRef.current.push({
        id: orbIdRef.current++, x, y, vx, vy, r,
        hue: shadow ? 280 + Math.random() * 60 : 30 + Math.random() * 320,
        shadow, age: 0, inGlassFor: 0,
        dying: false, dyingT: 0, destroyedBy: null,
      });
    };

    const burst = (x: number, y: number, hue: number, shadow: boolean, count = 14) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 3;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1, hue, shadow,
          size: 1.5 + Math.random() * 2.5,
        });
      }
    };

    const resetGame = () => {
      orbsRef.current = [];
      particlesRef.current = [];
      floatTextsRef.current = [];
      flashesRef.current = [];
      scoreRef.current = 0;
      displayScoreRef.current = 0;
      comboRef.current = 0;
      bestComboRef.current = 0;
      totalCapturesRef.current = 0;
      totalShattersRef.current = 0;
      lastSpawnRef.current = 0;
      countdownRef.current = 3;
      handsHeldRef.current = 0;
    };

    const pushFloatingText = (x: number, y: number, text: string, color: string, size = 22) => {
      floatTextsRef.current.push({ x, y, text, life: 1, color, size });
    };
    const pushFlash = (kind: FlashEvent['kind']) => {
      flashesRef.current.push({ t: 0, kind });
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
      const toC = (lm: any) => ({
        x: vr.left + (1 - lm.x) * vr.width,
        y: vr.top + lm.y * vr.height,
      });

      // ── Hand info ──
      let glassRect: { x: number; y: number; w: number; h: number } | null = null;
      let p0 = 0, p1 = 0;
      let hand0: { tip: any; thumb: any; palm: any; pinch: number } | null = null;
      let hand1: { tip: any; thumb: any; palm: any; pinch: number } | null = null;

      if (lms.length >= 1) {
        const tip = toC(lms[0][INDEX_TIP]);
        const thumb = toC(lms[0][THUMB_TIP]);
        const palm = toC(lms[0][PALM]);
        const maxPinchPx = 80;
        p0 = Math.max(0, Math.min(1, 1 - Math.hypot(tip.x - thumb.x, tip.y - thumb.y) / maxPinchPx));
        hand0 = { tip, thumb, palm, pinch: p0 };
      }
      if (lms.length >= 2) {
        const tip = toC(lms[1][INDEX_TIP]);
        const thumb = toC(lms[1][THUMB_TIP]);
        const palm = toC(lms[1][PALM]);
        const maxPinchPx = 80;
        p1 = Math.max(0, Math.min(1, 1 - Math.hypot(tip.x - thumb.x, tip.y - thumb.y) / maxPinchPx));
        hand1 = { tip, thumb, palm, pinch: p1 };

        const ax = Math.min(hand0!.tip.x, hand1.tip.x);
        const ay = Math.min(hand0!.tip.y, hand1.tip.y);
        const bx = Math.max(hand0!.tip.x, hand1.tip.x);
        const by = Math.max(hand0!.tip.y, hand1.tip.y);
        const w = bx - ax;
        const h = by - ay;
        if (w > 40 && h > 40) glassRect = { x: ax, y: ay, w, h };
      }

      // ── Phase transitions ──
      const phase = phaseRef.current;
      if (phase === 'intro') {
        if (lms.length === 2) handsHeldRef.current += dt; else handsHeldRef.current = 0;
        if (handsHeldRef.current > 1000) {
          phaseRef.current = 'countdown';
          phaseStartRef.current = now;
          countdownRef.current = 3;
        }
      } else if (phase === 'countdown') {
        const elapsed = now - phaseStartRef.current;
        const cd = 3 - Math.floor(elapsed / 1000);
        countdownRef.current = cd;
        if (elapsed > 3000) {
          phaseRef.current = 'playing';
          phaseStartRef.current = now;
          resetGame();
          phaseRef.current = 'playing';
          phaseStartRef.current = now;
        }
      } else if (phase === 'playing') {
        const elapsed = now - phaseStartRef.current;
        if (elapsed > GAME_DURATION) {
          phaseRef.current = 'gameover';
          phaseStartRef.current = now;
        }
      }

      // ── Spawn orbs while playing ──
      if (phase === 'playing') {
        const elapsed = now - phaseStartRef.current;
        const t = Math.min(1, elapsed / GAME_DURATION);
        const spawnInterval = ORB_SPAWN_INTERVAL_START * (1 - t) + ORB_SPAWN_INTERVAL_END * t;
        if (now - lastSpawnRef.current > spawnInterval && orbsRef.current.length < MAX_ORBS) {
          spawnOrb(W, H);
          lastSpawnRef.current = now;
        }
      }

      // ── Update orbs ──
      const surviving: Orb[] = [];
      for (const orb of orbsRef.current) {
        orb.age += dt;
        if (orb.dying) {
          orb.dyingT += dt / 350;
          if (orb.dyingT < 1) surviving.push(orb);
          continue;
        }
        // Drift; gentle wall reflection
        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        if (orb.x < 30 || orb.x > W - 30) orb.vx *= -1;
        if (orb.y < 30 || orb.y > H - 30) orb.vy *= -1;

        let killed = false;

        if (phase === 'playing') {
          // Glass capture (normal orbs only)
          if (!orb.shadow && glassRect) {
            const inside =
              orb.x > glassRect.x + orb.r * 0.4 &&
              orb.x < glassRect.x + glassRect.w - orb.r * 0.4 &&
              orb.y > glassRect.y + orb.r * 0.4 &&
              orb.y < glassRect.y + glassRect.h - orb.r * 0.4;
            if (inside) orb.inGlassFor += dt; else orb.inGlassFor = Math.max(0, orb.inGlassFor - dt * 0.5);
            if (orb.inGlassFor > CAPTURE_THRESHOLD_MS) {
              comboRef.current += 1;
              bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
              const gain = Math.round(POINTS_NORMAL * COMBO_MULT(comboRef.current - 1));
              scoreRef.current += gain;
              totalCapturesRef.current += 1;
              burst(orb.x, orb.y, orb.hue, false, 18);
              pushFloatingText(orb.x, orb.y - 14, `+${gain}`, `hsla(${orb.hue}, 95%, 75%, 1)`, 22);
              if (comboRef.current > 1) pushFloatingText(orb.x, orb.y - 36, `×${comboRef.current}`, 'rgba(180,255,220,0.95)', 16);
              pushFlash('capture');
              orb.dying = true; orb.destroyedBy = 'glass';
              killed = true;
            }
          }
          // Pinch destroys shadow orbs
          if (orb.shadow) {
            const handsList = [hand0, hand1].filter(Boolean) as Array<{ tip: any; pinch: number }>;
            for (const h of handsList) {
              if (h.pinch > PINCH_THRESHOLD) {
                const d = Math.hypot(h.tip.x - orb.x, h.tip.y - orb.y);
                if (d < orb.r + 18) {
                  comboRef.current += 1;
                  bestComboRef.current = Math.max(bestComboRef.current, comboRef.current);
                  const gain = Math.round(POINTS_SHADOW * COMBO_MULT(comboRef.current - 1));
                  scoreRef.current += gain;
                  totalShattersRef.current += 1;
                  burst(orb.x, orb.y, orb.hue, true, 24);
                  pushFloatingText(orb.x, orb.y - 14, `+${gain}`, 'rgba(255,170,200,1)', 24);
                  if (comboRef.current > 1) pushFloatingText(orb.x, orb.y - 38, `×${comboRef.current}`, 'rgba(255,200,220,0.95)', 16);
                  pushFlash('shatter');
                  orb.dying = true; orb.destroyedBy = 'pinch';
                  killed = true;
                  break;
                }
              }
            }
          }
          // Penalty: shadow orbs hitting glass break the combo
          if (orb.shadow && glassRect) {
            const inside =
              orb.x > glassRect.x &&
              orb.x < glassRect.x + glassRect.w &&
              orb.y > glassRect.y &&
              orb.y < glassRect.y + glassRect.h;
            if (inside) {
              comboRef.current = 0;
              burst(orb.x, orb.y, 0, true, 8);
              pushFloatingText(orb.x, orb.y - 14, 'COMBO LOST', 'rgba(255,120,140,1)', 14);
              pushFlash('penalty');
              orb.dying = true; orb.destroyedBy = 'pinch';
              killed = true;
            }
          }
          // Orb expires after 14s (resets combo only if visible)
          if (!killed && orb.age > 14_000) {
            if (!orb.shadow) comboRef.current = 0;
            orb.dying = true;
          }
        }

        if (!killed) surviving.push(orb);
      }
      orbsRef.current = surviving;

      // ── Update particles ──
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.03;
        p.life -= dt / 700;
        return p.life > 0;
      });

      // ── DRAW ──

      // Particles (under everything)
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.shadow
          ? `rgba(255,${100 + 80 * p.life},${180 + 60 * p.life},${p.life})`
          : `hsla(${p.hue}, 90%, ${65 + 15 * p.life}%, ${p.life})`;
        ctx.shadowColor = p.shadow ? 'rgba(255,80,140,0.9)' : `hsla(${p.hue}, 100%, 70%, 0.9)`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Orbs
      for (const orb of orbsRef.current) {
        const a = orb.dying ? 1 - orb.dyingT : Math.min(1, orb.age / 200);
        const scale = orb.dying ? 1 + orb.dyingT * 0.5 : 1;
        const r = orb.r * scale;
        ctx.save();
        ctx.globalAlpha = a;
        if (orb.shadow) {
          ctx.shadowColor = 'rgba(255,80,140,0.9)';
          ctx.shadowBlur = 30;
          // Outer pulse ring
          const pulse = 0.5 + 0.5 * Math.sin(orb.age / 150);
          ctx.strokeStyle = `rgba(255,80,140,${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, r + 6 + pulse * 6, 0, Math.PI * 2);
          ctx.stroke();
          // Body
          const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
          grad.addColorStop(0, 'rgba(255,180,210,0.85)');
          grad.addColorStop(0.6, 'rgba(180,40,100,0.55)');
          grad.addColorStop(1, 'rgba(60,0,30,0)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.shadowColor = `hsla(${orb.hue}, 100%, 70%, 0.9)`;
          ctx.shadowBlur = 26;
          // Capture progress ring
          if (orb.inGlassFor > 0) {
            ctx.strokeStyle = `rgba(255,255,255,${0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, r + 5, -Math.PI / 2, -Math.PI / 2 + (orb.inGlassFor / CAPTURE_THRESHOLD_MS) * Math.PI * 2);
            ctx.stroke();
          }
          // Body
          const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
          grad.addColorStop(0, `hsla(${orb.hue}, 95%, 85%, 0.9)`);
          grad.addColorStop(0.55, `hsla(${orb.hue}, 90%, 60%, 0.55)`);
          grad.addColorStop(1, `hsla(${orb.hue}, 80%, 40%, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2); ctx.fill();
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.beginPath();
          ctx.arc(orb.x - r * 0.32, orb.y - r * 0.34, r * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Glass rectangle
      if (glassRect) {
        const { x, y, w, h } = glassRect;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1;
        ctx.shadowColor = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 14;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();

        const cs = 16;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2;
        [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy]) => {
          ctx.beginPath();
          ctx.moveTo(cx + sx * cs, cy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx, cy + sy * cs);
          ctx.stroke();
        });
        ctx.restore();
      }

      // Hand markers
      for (const h of [hand0, hand1]) {
        if (!h) continue;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 14 + h.pinch * 18;
        ctx.beginPath();
        ctx.arc(h.tip.x, h.tip.y, 5 + h.pinch * 4, 0, Math.PI * 2);
        ctx.fill();
        if (h.pinch > PINCH_THRESHOLD) {
          ctx.strokeStyle = 'rgba(255,160,200,0.9)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(h.tip.x, h.tip.y, 18, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Floating "+points" / "×combo" texts
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

      // Edge flashes (capture/shatter/penalty)
      flashesRef.current = flashesRef.current.filter(f => {
        f.t += dt / 350;
        return f.t < 1;
      });
      for (const f of flashesRef.current) {
        const alpha = (1 - f.t) * 0.4;
        const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
        const color = f.kind === 'capture'
          ? `rgba(120,255,180,${alpha})`
          : f.kind === 'shatter'
          ? `rgba(255,140,200,${alpha})`
          : `rgba(255,80,80,${alpha})`;
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, color);
        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // Combo glow on screen edges (only when combo >= 3 and playing)
      if (phase === 'playing' && comboRef.current >= 3) {
        const intensity = Math.min(1, (comboRef.current - 2) / 8);
        const pulse = 0.5 + 0.5 * Math.sin(now / 280);
        const a = (0.08 + 0.18 * intensity) * (0.7 + 0.3 * pulse);
        const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.7);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(180,255,220,${a})`);
        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // Vignette (always on, very subtle)
      const vGrad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.85);
      vGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.save();
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Tween display score toward actual score (count-up effect)
      displayScoreRef.current += (scoreRef.current - displayScoreRef.current) * Math.min(1, dt / 220);

      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    // UI tick at 10Hz so React HUD stays in sync with the refs
    const ui = setInterval(() => setUiTick(n => n + 1), 100);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      clearInterval(ui);
    };
  }, []);

  // ── ESC to exit ──
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
  const captures = totalCapturesRef.current;
  const shatters = totalShattersRef.current;

  const grade =
    score >= 1500 ? { letter: 'S', tag: 'LEGENDARY', color: 'rgba(255,220,140,1)' }
    : score >= 1000 ? { letter: 'A', tag: 'EXCELLENT', color: 'rgba(180,255,220,1)' }
    : score >= 650 ? { letter: 'B', tag: 'NICE', color: 'rgba(180,200,255,1)' }
    : score >= 350 ? { letter: 'C', tag: 'OK', color: 'rgba(255,255,255,0.8)' }
    : { letter: 'D', tag: 'KEEP TRYING', color: 'rgba(255,180,180,0.85)' };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="fixed inset-0 overflow-hidden z-[9999]" style={{ background: 'linear-gradient(135deg, #0a0a12 0%, #0e0e18 50%, #0a0a12 100%)' }}>
      {/* Backdrop blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '5%', left: '2%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(130,130,255,0.32), transparent 70%)', filter: 'blur(55px)' }} />
        <div style={{ position: 'absolute', bottom: '4%', right: '4%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,100,140,0.28), transparent 70%)', filter: 'blur(65px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(80,255,200,0.24), transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      {/* Subtle grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.06 }}>
        <defs>
          <pattern id="sg" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sg)" />
      </svg>

      {/* Camera (mirrored, behind canvas) */}
      <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 560, height: 420, opacity: 0.18 }}>
        <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)', display: 'block' }} muted playsInline autoPlay />
      </div>

      {/* Game canvas overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* ── HUD: top-left score panel ── */}
      <div className="absolute" style={{ top: 24, left: 28, display: 'flex', flexDirection: 'column', gap: 8, width: 200 }}>
        <button
          onClick={onExit}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.22)',
            backdropFilter: 'blur(12px)',
            borderRadius: 6,
            padding: '8px 14px',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase',
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
            <span style={{ color: combo > 0 ? 'rgba(120,255,180,0.95)' : 'rgba(255,255,255,0.45)' }}>×{combo}</span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
            <span>BEST</span>
            <span>×{bestCombo}</span>
          </div>
        </div>
      </div>

      {/* ── HUD: top-right title + timer ── */}
      <div className="absolute" style={{ top: 24, right: 28, display: 'flex', flexDirection: 'column', gap: 8, width: 220 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>TOOLBOX /// SECRET</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.92)', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", letterSpacing: '-0.04em' }}>GLASS HUNT</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginTop: 2, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>{timeStr}</div>
        </div>

        {phase === 'playing' && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>TIME LEFT</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: timeLeft < 10000 ? 'rgba(255,140,140,0.95)' : 'rgba(255,255,255,0.95)', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", letterSpacing: '-0.02em', lineHeight: 1 }}>
              {(timeLeft / 1000).toFixed(1)}s
            </div>
            <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(timeLeft / GAME_DURATION) * 100}%`,
                background: timeLeft < 10000
                  ? 'linear-gradient(90deg, rgba(255,80,80,0.9), rgba(255,160,160,0.9))'
                  : 'linear-gradient(90deg, rgba(120,255,180,0.9), rgba(180,200,255,0.9))',
                transition: 'width 0.1s linear',
              }} />
            </div>
          </div>
        )}

        <div className="pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>HOW TO PLAY</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, letterSpacing: '0.05em', fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
            <span style={{ color: 'rgba(180,255,210,0.9)' }}>● ORB</span> · 두 손 검지로 글라스 만들어 가두기<br />
            <span style={{ color: 'rgba(255,140,180,0.9)' }}>● SHADOW</span> · 엄지·검지 핀치로 부수기<br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>※ 그림자가 글라스에 닿으면 콤보 리셋</span>
          </div>
        </div>
      </div>

      {/* ── Phase overlays ── */}
      {phase === 'intro' && (
        <div className="absolute pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: '90%', maxWidth: 520 }}>
          <div style={{
            background: 'rgba(20,20,30,0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            padding: '36px 40px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 14, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>READY</div>
            <h1 style={{ fontSize: 56, fontWeight: 900, color: 'white', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 14, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>GLASS HUNT</h1>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.05em', lineHeight: 1.7, marginBottom: 22, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
              60초 안에 떠다니는 오브를 가두고 부수세요.<br />
              두 손을 카메라 앞에 들면 시작합니다.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '10px 18px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 999,
              fontSize: 10,
              color: lms_count(landmarksRef.current) === 2 ? 'rgba(120,255,180,0.95)' : 'rgba(255,255,255,0.55)',
              letterSpacing: '0.3em', textTransform: 'uppercase',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            }}>
              {status === 'loading'
                ? 'INITIALIZING CAMERA…'
                : status === 'error'
                ? 'CAMERA ERROR'
                : `HANDS DETECTED · ${lms_count(landmarksRef.current)}/2`}
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
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-0.05em',
              textShadow: '0 0 80px rgba(255,255,255,0.7), 0 0 160px rgba(180,200,255,0.3)',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              lineHeight: 1,
              animation: 'cdpop 1s ease-out',
            }}
          >
            {countdownRef.current > 0 ? countdownRef.current : 'GO'}
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

            {/* Grade */}
            <div style={{
              display: 'inline-block',
              padding: '4px 28px',
              fontSize: 140,
              fontWeight: 900,
              color: grade.color,
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              lineHeight: 1,
              letterSpacing: '-0.06em',
              textShadow: `0 0 60px ${grade.color}`,
              marginTop: 4,
              marginBottom: 4,
            }}>{grade.letter}</div>
            <div style={{ fontSize: 11, color: grade.color, letterSpacing: '0.45em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 22, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>{grade.tag}</div>

            {/* Stat row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 28, paddingTop: 18, paddingBottom: 18, borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <Stat label="SCORE" value={score.toLocaleString()} highlight />
              <Stat label="BEST COMBO" value={`×${bestCombo}`} />
              <Stat label="CAPTURED" value={`${captures} · ${shatters}`} sub="orb · shadow" />
            </div>

            <button
              onClick={handleRetry}
              style={{
                background: 'rgba(255,255,255,0.96)',
                color: '#000',
                border: 'none',
                borderRadius: 999,
                padding: '14px 38px',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                marginRight: 10,
                boxShadow: '0 8px 30px rgba(255,255,255,0.15)',
              }}
            >
              ↺ Retry
            </button>
            <button
              onClick={onExit}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 999,
                padding: '14px 28px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              }}
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Bottom hint */}
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

const Stat = ({ label, value, sub, highlight = false }: { label: string; value: string; sub?: string; highlight?: boolean }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>{label}</div>
    <div style={{
      fontSize: highlight ? 26 : 20,
      fontWeight: 900,
      color: highlight ? 'white' : 'rgba(255,255,255,0.9)',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      letterSpacing: '-0.02em',
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
    }}>{value}</div>
    {sub && (
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4, fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>{sub}</div>
    )}
  </div>
);
