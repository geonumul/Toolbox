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
  const [showExit, setShowExit] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShowExit(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Clock tick for live readouts (triggers re-render every second to update timeStr)
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

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
          else if (status === "tracking") setStatus("ready");
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
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(minX, minY, w, h);
          ctx.restore();

          // ── Glass border ──
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 1;
          ctx.shadowColor = "rgba(255,255,255,0.4)";
          ctx.shadowBlur = 14;
          ctx.strokeRect(minX, minY, w, h);
          ctx.restore();

          // ── Corner brackets ──
          const cs = 16;
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.lineWidth = 2;
          [[minX, minY, 1, 1], [maxX, minY, -1, 1], [minX, maxY, 1, -1], [maxX, maxY, -1, -1]].forEach(([cx, cy, sx, sy]) => {
            ctx.beginPath();
            ctx.moveTo(cx + sx * cs, cy);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx, cy + sy * cs);
            ctx.stroke();
          });
          ctx.restore();

          // ── Size readout ──
          ctx.save();
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.font = "8px monospace";
          ctx.letterSpacing = "2px";
          ctx.fillText(`${Math.round(w)} × ${Math.round(h)}`, minX + 4, maxY + 14);
          ctx.restore();

          // ── Distortion lines (clipped to glass) ──
          const avgPinch = (p0 + p1) / 2;
          if (avgPinch > 0.05) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(minX + 1, minY + 1, w - 2, h - 2);
            ctx.clip();
            ctx.lineWidth = 0.8;

            for (let row = minY + 5; row <= maxY - 5; row += 9) {
              ctx.beginPath();
              for (let x = minX; x <= maxX; x += 3) {
                const relX = (x - minX) / w;
                const leftW = Math.pow(1 - relX, 1.5);
                const rightW = Math.pow(relX, 1.5);
                const amp = p0 * leftW * 18 + p1 * rightW * 18;
                const dy =
                  Math.sin((relX * 6 + t * 2.5) * Math.PI) * amp +
                  Math.sin((relX * 3.5 + t * 1.8 + 1) * Math.PI) * amp * 0.4;
                const alpha = 0.08 + avgPinch * 0.22;
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
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
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
          ctx.save();
          ctx.strokeStyle = `rgba(255,255,255,${0.3 + pn * 0.55})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(thumb.x, thumb.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.shadowColor = "white";
          ctx.shadowBlur = 16 + pn * 24;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 5 + pn * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.fillStyle = `rgba(255,255,255,${0.45 + pn * 0.5})`;
          ctx.shadowColor = "white";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(thumb.x, thumb.y, 3 + pn * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (pn > 0.08) {
            ctx.save();
            ctx.strokeStyle = `rgba(255,255,255,${pn * 0.55})`;
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
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(thumb.x, thumb.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
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

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className="fixed inset-0 overflow-hidden z-[9999]" style={{ background: "linear-gradient(135deg, #0e0e14 0%, #111118 50%, #0e0e14 100%)" }}>

      {/* Background: subtle grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.06 }}>
        <defs>
          <pattern id="sg" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sg)" />
      </svg>

      {/* Background: glassmorphism colour blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute", top:"5%", left:"2%", width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle, rgba(130,130,255,0.35), transparent 70%)", filter:"blur(55px)", opacity:0.65 }} />
        <div style={{ position:"absolute", bottom:"4%", right:"4%", width:440, height:440, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,100,140,0.28), transparent 70%)", filter:"blur(65px)", opacity:0.55 }} />
        <div style={{ position:"absolute", top:"40%", right:"10%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(80,255,200,0.25), transparent 70%)", filter:"blur(50px)", opacity:0.45 }} />
        <div style={{ position:"absolute", top:"60%", left:"5%", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(200,160,255,0.2), transparent 70%)", filter:"blur(40px)", opacity:0.4 }} />
      </div>

      {/* ── LEFT COLUMN: exit + sys info + visualizer + config ── */}
      <div className="absolute" style={{ top: 24, left: 28, display: "flex", flexDirection: "column", gap: 8, width: 148 }}>
        {/* Exit button */}
        <button
          onClick={onExit}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.22)",
            backdropFilter: "blur(12px)",
            borderRadius: 6,
            padding: "8px 14px",
            color: "rgba(255,255,255,0.85)",
            fontSize: 10, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", letterSpacing: "0.3em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.3s",
            opacity: showExit ? 1 : 0,
            pointerEvents: showExit ? "auto" : "none",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
        >
          ← TOOLBOX
        </button>

        {/* System info panel */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 8, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.35)", letterSpacing: "0.3em", marginBottom: 8, textTransform: "uppercase" }}>SYS ◆ LIVE</div>
          <div style={{ fontSize: 13, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.8)", letterSpacing: "0.06em", lineHeight: 1.3 }}>{timeStr}</div>
          <div style={{ fontSize: 9, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.1em" }}>{dateStr}</div>
          <div style={{ marginTop: 10, height: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em" }}>
              <span>HANDS</span>
              <span style={{ color: landmarksRef.current.length > 0 ? "rgba(100,255,160,0.85)" : "rgba(255,255,255,0.35)" }}>{landmarksRef.current.length} / 2</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em" }}>
              <span>MODE</span>
              <span style={{ color: status === "tracking" ? "rgba(100,255,160,0.85)" : "rgba(255,200,80,0.7)" }}>{status.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Visualizer */}
        <div className="pointer-events-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", borderRadius: 6, padding: "12px 12px" }}>
          <div style={{ fontSize: 7, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.3)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 10 }}>VISUALIZER</div>
          {[0.9, 0.6, 0.8, 0.45, 0.7].map((v, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 7, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>CH {String(i+1).padStart(2,"0")}</span>
                <span style={{ fontSize: 7, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.35)" }}>{Math.round(v * 100)}%</span>
              </div>
              <div style={{ height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1 }}>
                <div style={{ height: "100%", width: `${v * 100}%`, background: `rgba(255,255,255,${0.2 + v * 0.4})`, borderRadius: 1 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Config */}
        <div className="pointer-events-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "12px 12px" }}>
          <div style={{ fontSize: 7, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>CONFIG</div>
          {["MODEL: FULL", "CONF: 0.75", "TRACK: 0.50", "HANDS: 2"].map((line, i) => (
            <div key={i} style={{ fontSize: 8, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", lineHeight: 1.8 }}>{line}</div>
          ))}
        </div>
      </div>

      {/* ── RIGHT COLUMN: title + gestures + how-to ── */}
      <div className="absolute" style={{ top: 24, right: 28, display: "flex", flexDirection: "column", gap: 8, width: 160 }}>
        {/* Title panel */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 7, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.35)", letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 4 }}>TOOLBOX /// SECRET</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "rgba(255,255,255,0.75)", fontFamily: "'Pretendard Variable', Pretendard, sans-serif", letterSpacing: "-0.04em" }}>GLASSMORPHISM</div>
          <div style={{ fontSize: 7, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", marginTop: 3 }}>HAND-TRACKING CANVAS</div>
        </div>

        {/* Gestures panel */}
        <div className="pointer-events-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", borderRadius: 6, padding: "12px 12px" }}>
          <div style={{ fontSize: 7, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.3)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 10 }}>GESTURES</div>
          {["INDEX L", "INDEX R", "PINCH L", "PINCH R", "GLASS"].map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
              <span style={{ fontSize: 8, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* How-to panel */}
        <div className="pointer-events-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "12px 12px" }}>
          <div style={{ fontSize: 7, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>HOW TO</div>
          <div style={{ fontSize: 8, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: "rgba(255,255,255,0.4)", lineHeight: 1.9, letterSpacing: "0.05em" }}>
            1. SHOW 2 HANDS<br />
            2. INDEX FINGERS<br />
            &nbsp;&nbsp;&nbsp;DEFINE GLASS<br />
            3. PINCH TO<br />
            &nbsp;&nbsp;&nbsp;DISTORT
          </div>
        </div>
      </div>

      {/* Camera window */}
      <div className="absolute" style={{ top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:560, height:420 }}>
        {/* Corner brackets */}
        {([[0,0,"tl"],[1,0,"tr"],[0,1,"bl"],[1,1,"br"]] as [number,number,string][]).map(([rx,ry,k]) => (
          <div key={k} className="absolute w-5 h-5 pointer-events-none" style={{
            top: ry === 0 ? -1 : "auto", bottom: ry === 1 ? -1 : "auto",
            left: rx === 0 ? -1 : "auto", right: rx === 1 ? -1 : "auto",
            borderTop: ry === 0 ? "1.5px solid rgba(255,255,255,0.6)" : undefined,
            borderBottom: ry === 1 ? "1.5px solid rgba(255,255,255,0.6)" : undefined,
            borderLeft: rx === 0 ? "1.5px solid rgba(255,255,255,0.6)" : undefined,
            borderRight: rx === 1 ? "1.5px solid rgba(255,255,255,0.6)" : undefined,
          }} />
        ))}

        {/* Status label */}
        <div className="absolute pointer-events-none" style={{ top:-22, left:0, fontSize:9, fontFamily:"monospace", color:"rgba(255,255,255,0.35)", letterSpacing:"0.25em", textTransform:"uppercase" }}>
          CAMERA ◆ {status === "tracking" ? "TRACKING" : status === "ready" ? "READY" : status === "loading" ? "LOADING..." : "ERROR"}
        </div>

        {/* Resolution label */}
        <div className="absolute pointer-events-none" style={{ top:-22, right:0, fontSize:9, fontFamily:"monospace", color:"rgba(255,255,255,0.2)", letterSpacing:"0.2em" }}>
          640 × 480
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/85">
            <p className="text-white/50 text-[10px] tracking-[0.3em] uppercase animate-pulse">Loading hand model…</p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85">
            <p className="text-white/55 text-[10px] tracking-widest uppercase text-center leading-6">
              Camera access required<br />Allow permission &amp; reload
            </p>
          </div>
        )}
      </div>

      {/* Canvas overlay (full screen) */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* ── BOTTOM: Instructions bar ── */}
      {status !== "error" && (
        <div className="absolute pointer-events-none" style={{ bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", borderRadius: 6, padding: "10px 24px", display: "flex", gap: 36, color: "rgba(255,255,255,0.45)", fontSize: 9, fontFamily: "'Pretendard Variable', Pretendard, sans-serif", letterSpacing: "0.25em", textTransform: "uppercase" }}>
            <span>☞ TWO INDEX FINGERS → DEFINE GLASS</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <span>☞ PINCH TO DISTORT</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <span>ESC TO EXIT</span>
          </div>
        </div>
      )}
    </div>
  );
};
