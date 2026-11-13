"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Eye, 
  FlipHorizontal, 
  Sparkles,
  Clock,
  Type
} from "lucide-react";
import { TaxReelScript } from "../CaCreatorContentStudio";

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: TaxReelScript | null;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  isOpen,
  onClose,
  script
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(2); // 1 = slow, 2 = normal, 3 = fast, 4 = turbo
  const [fontSize, setFontSize] = useState<"NORMAL" | "LARGE" | "XL">("LARGE");
  const [isMirrored, setIsMirrored] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && scrollContainerRef.current) {
      interval = setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += speed * 1.2;
        }
      }, 35);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  // Elapsed timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  if (!isOpen || !script) return null;

  const handleReset = () => {
    setIsPlaying(false);
    setElapsedSec(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const fontSizeClasses = {
    NORMAL: "text-lg sm:text-xl leading-relaxed",
    LARGE: "text-2xl sm:text-3xl leading-relaxed",
    XL: "text-3xl sm:text-4xl leading-loose"
  }[fontSize];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Live Teleprompter
            </span>
            <div className="hidden sm:block">
              <h3 className="text-sm font-bold text-white truncate max-w-xs">
                {script.title}
              </h3>
              <p className="text-[11px] text-slate-400">
                Target: ~{script.durationSec}s Reel | {script.category}
              </p>
            </div>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-2">
            {/* Speed Buttons */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center text-xs font-bold">
              {[
                { label: "1x", val: 1 },
                { label: "1.5x", val: 2 },
                { label: "2x", val: 3 },
                { label: "3x", val: 5 }
              ].map((sp) => (
                <button
                  key={sp.label}
                  onClick={() => setSpeed(sp.val)}
                  className={`px-2 py-1 rounded-lg transition ${
                    speed === sp.val ? "bg-pink-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            {/* Font Size */}
            <button
              onClick={() => {
                if (fontSize === "NORMAL") setFontSize("LARGE");
                else if (fontSize === "LARGE") setFontSize("XL");
                else setFontSize("NORMAL");
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1"
              title="Toggle Font Size"
            >
              <Type className="w-4 h-4" />
              <span className="text-[10px]">{fontSize}</span>
            </button>

            {/* Mirror Mode (for glass teleprompters) */}
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className={`p-2 rounded-xl text-xs transition ${
                isMirrored ? "bg-pink-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Mirror Text for Physical Teleprompter Glass"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition"
              title="Reset to Top"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Scroll</span>
                </>
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? "bg-red-500 animate-pulse" : "bg-slate-600"}`} />
            <span>{isPlaying ? "RECORDING SCROLL ACTIVE" : "PAUSED"}</span>
          </div>
          <div>
            Elapsed: <strong className="text-pink-400">{elapsedSec}s</strong> / Target: ~{script.durationSec}s
          </div>
        </div>

        {/* Teleprompter Scroll Screen */}
        <div 
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto p-8 sm:p-16 space-y-12 select-none scrollbar-none transition-transform ${
            isMirrored ? "-scale-x-100" : ""
          }`}
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Eyeline Indicator Marker */}
          <div className="sticky top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent pointer-events-none" />

          {/* Hook Segment */}
          <div className="space-y-3 border-l-4 border-pink-500 pl-6 bg-pink-950/20 p-6 rounded-2xl">
            <div className="text-xs font-mono font-bold tracking-widest uppercase text-pink-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 0-3 SECONDS VIRAL HOOK (LOOK DIRECTLY INTO CAMERA)
            </div>
            <p className={`font-black text-white ${fontSizeClasses}`}>
              "{script.hook}"
            </p>
          </div>

          {/* Director Cue 1 */}
          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider bg-slate-900/60 py-1.5 px-4 rounded-full inline-block">
            🎬 DIRECTOR CUE: Deliver breakdown with punchy, high-energy cadence
          </div>

          {/* Script Body Breakdown */}
          <div className="space-y-10 pl-6 border-l-2 border-slate-800">
            {script.body.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider block">
                  Point {idx + 1}
                </span>
                <p className={`font-bold text-slate-200 ${fontSizeClasses}`}>
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Call to action */}
          <div className="space-y-3 border-l-4 border-emerald-500 pl-6 bg-emerald-950/20 p-6 rounded-2xl">
            <div className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-400">
              FINAL 5 SECONDS: CALL TO ACTION (CTA)
            </div>
            <p className={`font-black text-white ${fontSizeClasses}`}>
              "{script.cta}"
            </p>
          </div>

          {/* Extra bottom padding to allow full scroll */}
          <div className="h-64 flex items-center justify-center text-slate-600 text-xs font-mono">
            &bull; &bull; &bull; END OF REEL SCRIPT &bull; &bull; &bull;
          </div>
        </div>

      </div>
    </div>
  );
};
