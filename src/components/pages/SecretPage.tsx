import React, { useEffect, useRef, useState } from "react";

const THUMB_TIP = 4;
const INDEX_TIP = 8;

const loadScript = (src: string): Promise<void> =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => res();
    s.onerror = rej;
    document.head.appendChild(s);
  });

export const SecretPage = ({ onExit }: { onExit: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "tracking" | "error">("loading");

  // Init MediaPipe + camera
  useEffect(() => {
    let animId: number;
    let stream: MediaStream | null = null;
    let hands: any = null;

    const init = async () => {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");

        const W = window as any;
        hands = new W.Hands({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.75, minTrackingConfidence: 0.5 });
        hands.onResults((r: any) => {
          landmarksRef.current = r.multiHandLandmarks || [];
          if (landmarksRef.current.length > 0) setStatus("tracking");
        });
        await hands.initialize();

        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("ready");

        const process = async () => {
          if (videoRef.current && hands) await hands.send({ image: videoRef.current });
          animId = requestAnimationFrame(process);
        };
        animId = requestAnimationFrame(process);
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    };

    init();
    return () => {
      cancelAnimationFrame(animId);
      stream?.getTracks().forEach(t => t.stop());
      hands?.close?.();
    };
  }, []);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const t0 = Date.now();
    let drawId: number;

    const draw = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const lms = landmarksRef.current;
      const video = videoRef.current;
      if (!video) { drawId = requestAnimationFrame(draw); return; }

      const vr = video.getBoundingClientRect();
      const t = (Date.now() - t0) / 1000;

      // Normalized → canvas coords (x mirrored to match CSS scaleX(-1))
      const toC = (lm: any) => ({
        x: vr.left + (1 - lm.x) * vr.width,
        y: vr.top + lm.y * vr.height,
      });

      if (lms.length >= 2) {
        const i0 = toC(lms[0][INDEX_TIP]);
        const i1 = toC(lms[1][INDEX_TIP]);
        const th0 = toC(lms[0][THUMB_TIP]);
        const th1 = toC(lms[1][THUMB_TIP]);

        const maxPinchPx = 80;
        const p0 = Math.max(0, Math.min(1, 1 - Math.hypot(i0.x - th0.x, i0.y - th0.y) / maxPinchPx));
        const p1 = Math.max(0, Math.min(1, 1 - Math.hypot(i1.x - th1.x, i1.y - th1.y) / maxPinchPx));

        const minX = Math.min(i0.x, i1.x);
        const minY = Math.min(i0.y, i1.y);
        const maxX = Math.max(i0.x, i1.x);
        const maxY = Math.max(i0.y, i1.y);
        const w = maxX - minX;
        const h = maxY - minY;

        if (w > 30 && h > 30) {
          // ── Glass fill ──
          ctx.save();
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.fillRect(minX, minY, w, h);
          ctx.restore();

          // ── Glass border ──
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.35)";
          ctx.lineWidth = 1;
          ctx.shadowColor = "rgba(255,255,255,0.25)";
          ctx.shadowBlur = 10;
          ctx.strokeRect(minX, minY, w, h);
          ctx.restore();

          // ── Corner brackets ──
          const cs = 14;
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 1.5;
          [[minX, minY, 1, 1], [maxX, minY, -1, 1], [minX, maxY, 1, -1], [maxX, maxY, -1, -1]].forEach(([cx, cy, sx, sy]) => {
            ctx.beginPath();
            ctx.moveTo(cx + sx * cs, cy);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx, cy + sy * cs);
            ctx.stroke();
          });
          ctx.restore();

          // ── Distortion lines (clipped to glass) ──
          const avgPinch = (p0 + p1) / 2;
          if (avgPinch > 0.05) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(minX + 1, minY + 1, w - 2, h - 2);
            ctx.clip();
            ctx.lineWidth = 0.7;

            for (let row = minY + 5; row <= maxY - 5; row += 9) {
              ctx.beginPath();
              for (let x = minX; x <= maxX; x += 3) {
                const relX = (x - minX) / w;
                // Left corner driven by p0, right by p1
                const leftW = Math.pow(1 - relX, 1.5);
                const rightW = Math.pow(relX, 1.5);
                const amp = p0 * leftW * 18 + p1 * rightW * 18;
                const dy =
                  Math.sin((relX * 6 + t * 2.5) * Math.PI) * amp +
                  Math.sin((relX * 3.5 + t * 1.8 + 1) * Math.PI) * amp * 0.4;
                const alpha = 0.05 + avgPinch * 0.18;
                ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                if (x === minX) ctx.moveTo(x, row + dy);
                else ctx.lineTo(x, row + dy);
              }
              ctx.stroke();
            }
            ctx.restore();
          }

          // ── Diagonal center line ──
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth = 0.5;
          ctx.setLineDash([4, 8]);
          ctx.beginPath();
          ctx.moveTo(minX, minY);
          ctx.lineTo(maxX, maxY);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(maxX, minY);
          ctx.lineTo(minX, maxY);
          ctx.stroke();
          ctx.restore();
        }

        // ── Hand nodes ──
        ([[i0, th0, p0], [i1, th1, p1]] as Array<[{x:number,y:number}, {x:number,y:number}, number]>).forEach(([tip, thumb, pn]) => {
          // Dashed line
          ctx.save();
          ctx.strokeStyle = `rgba(255,255,255,${0.2 + pn * 0.5})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(thumb.x, thumb.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();
          ctx.restore();

          // Index tip glow
          ctx.save();
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.shadowColor = "white";
          ctx.shadowBlur = 12 + pn * 20;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 5 + pn * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Thumb dot
          ctx.save();
          ctx.fillStyle = `rgba(255,255,255,${0.35 + pn * 0.5})`;
          ctx.shadowColor = "white";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(thumb.x, thumb.y, 3 + pn * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Pinch ring
          if (pn > 0.08) {
            ctx.save();
            ctx.strokeStyle = `rgba(255,255,255,${pn * 0.45})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 18 + pn * 8, 0, Math.PI * 2 * pn);
            ctx.stroke();
            ctx.restore();
          }
        });

      } else if (lms.length === 1) {
        const tip = toC(lms[0][INDEX_TIP]);
        const thumb = toC(lms[0][THUMB_TIP]);

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(thumb.x, thumb.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("BRING SECOND HAND", tip.x, tip.y - 18);
        ctx.restore();
      }

      drawId = requestAnimationFrame(draw);
    };

    drawId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(drawId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onExit(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#080808" }}>

      {/* Background: subtle grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.035 }}>
        <defs>
          <pattern id="sg" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sg)" />
      </svg>

      {/* Background: glassmorphism colour blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute", top:"8%", left:"4%", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle, rgba(120,120,255,0.25), transparent 70%)", filter:"blur(50px)", opacity:0.5 }} />
        <div style={{ position:"absolute", bottom:"6%", right:"6%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,100,120,0.2), transparent 70%)", filter:"blur(60px)", opacity:0.4 }} />
        <div style={{ position:"absolute", top:"45%", right:"12%", width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle, rgba(80,255,180,0.2), transparent 70%)", filter:"blur(45px)", opacity:0.35 }} />
      </div>

      {/* Floating glassmorphism panels (decorative) */}
      <div className="absolute pointer-events-none" style={{ top:"12%", left:"6%", width:160, height:100, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(8px)" }}>
        <div style={{ position:"absolute", top:6, left:6, right:6, height:1, background:"rgba(255,255,255,0.15)" }} />
      </div>
      <div className="absolute pointer-events-none" style={{ bottom:"14%", left:"8%", width:120, height:80, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(8px)" }} />
      <div className="absolute pointer-events-none" style={{ top:"18%", right:"7%", width:200, height:120, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(8px)" }}>
        <div style={{ position:"absolute", bottom:6, left:6, right:6, height:1, background:"rgba(255,255,255,0.12)" }} />
      </div>

      {/* Camera window */}
      <div className="absolute" style={{ top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:560, height:420 }}>
        {/* Corner brackets */}
        {([[0,0,"tl"],[1,0,"tr"],[0,1,"bl"],[1,1,"br"]] as [number,number,string][]).map(([rx,ry,k]) => (
          <div key={k} className="absolute w-4 h-4 pointer-events-none" style={{
            top: ry === 0 ? -1 : "auto", bottom: ry === 1 ? -1 : "auto",
            left: rx === 0 ? -1 : "auto", right: rx === 1 ? -1 : "auto",
            borderTop: ry === 0 ? "1px solid rgba(255,255,255,0.5)" : undefined,
            borderBottom: ry === 1 ? "1px solid rgba(255,255,255,0.5)" : undefined,
            borderLeft: rx === 0 ? "1px solid rgba(255,255,255,0.5)" : undefined,
            borderRight: rx === 1 ? "1px solid rgba(255,255,255,0.5)" : undefined,
          }} />
        ))}

        {/* Status label */}
        <div className="absolute pointer-events-none" style={{ top:-22, left:0, fontSize:9, fontFamily:"monospace", color:"rgba(255,255,255,0.2)", letterSpacing:"0.25em", textTransform:"uppercase" }}>
          CAMERA ◆ {status === "tracking" ? "TRACKING" : status === "ready" ? "READY" : status === "loading" ? "LOADING..." : "ERROR"}
        </div>

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform:"scaleX(-1)", display:"block" }}
          muted
          playsInline
          autoPlay
        />

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase animate-pulse">Loading hand model…</p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <p className="text-white/35 text-[10px] tracking-widest uppercase text-center leading-6">
              Camera access required<br />Allow permission &amp; reload
            </p>
          </div>
        )}
      </div>

      {/* Canvas overlay (full screen) */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Back button */}
      <button
        onClick={onExit}
        className="absolute top-6 left-8 z-20 text-white/20 hover:text-white/70 transition-colors"
        style={{ fontSize:9, fontFamily:"monospace", letterSpacing:"0.4em", textTransform:"uppercase" }}
      >
        ← TOOLBOX
      </button>

      {/* Title */}
      <div className="absolute top-6 right-8 z-20 text-right pointer-events-none">
        <p style={{ fontSize:9, fontFamily:"monospace", color:"rgba(255,255,255,0.15)", letterSpacing:"0.3em", textTransform:"uppercase" }}>SECRET ///</p>
        <p style={{ fontSize:13, fontWeight:900, color:"rgba(255,255,255,0.45)", letterSpacing:"-0.03em", marginTop:2 }}>GLASSMORPHISM</p>
      </div>

      {/* Instructions */}
      {status !== "error" && (
        <div className="absolute bottom-7 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div style={{ display:"flex", gap:32, color:"rgba(255,255,255,0.18)", fontSize:9, fontFamily:"monospace", letterSpacing:"0.25em", textTransform:"uppercase" }}>
            <span>☞ TWO INDEX FINGERS → DEFINE GLASS</span>
            <span>☞ PINCH TO DISTORT</span>
          </div>
        </div>
      )}
    </div>
  );
};
