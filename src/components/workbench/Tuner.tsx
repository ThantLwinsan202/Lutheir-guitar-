import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Activity, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function Tuner() {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cents, setCents] = useState(0);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const animationId = useRef<number | null>(null);

  const getNote = (frequency: number) => {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const roundedNote = Math.round(noteNum) + 69;
    const centsOff = Math.floor(100 * (noteNum - Math.round(noteNum)));
    return {
      note: NOTES[roundedNote % 12],
      cents: centsOff
    };
  };

  const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
    let SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      rms += buf[i] * buf[i];
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  };

  const updatePitch = useCallback(() => {
    if (!analyser.current) return;
    const buffer = new Float32Array(2048);
    analyser.current.getFloatTimeDomainData(buffer);
    const ac = autoCorrelate(buffer, audioContext.current!.sampleRate);

    if (ac !== -1) {
      setPitch(ac);
      const { note, cents } = getNote(ac);
      setNote(note);
      setCents(cents);
    }

    animationId.current = window.requestAnimationFrame(updatePitch);
  }, []);

  const toggleTuner = async () => {
    if (!isListening) {
      try {
        stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser.current = audioContext.current.createAnalyser();
        analyser.current.fftSize = 2048;
        
        const source = audioContext.current.createMediaStreamSource(stream.current);
        source.connect(analyser.current);
        
        setIsListening(true);
        updatePitch();
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    } else {
      setIsListening(false);
      if (animationId.current) window.cancelAnimationFrame(animationId.current);
      if (stream.current) stream.current.getTracks().forEach(track => track.stop());
      setPitch(null);
      setNote(null);
      setCents(0);
    }
  };

  useEffect(() => {
    return () => {
      if (animationId.current) window.cancelAnimationFrame(animationId.current);
      if (stream.current) stream.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="glass-panel p-6 lg:p-10 flex flex-col items-center relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl group">
      {/* Hardware Accents */}
      <div className="absolute top-4 left-4 flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
      </div>

      <div className="mb-10 text-center relative z-10">
        <h4 className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold mb-8">Strobe Tuner Engine</h4>
        <div className="relative w-56 h-56 lg:w-64 lg:h-64 flex items-center justify-center">
          {/* Strobe Ring */}
          <motion.div 
            animate={{ 
              rotate: isListening && pitch ? (cents > 0 ? 360 : -360) : 0,
              opacity: isListening ? 1 : 0.1
            }}
            transition={{ 
              repeat: Infinity, 
              duration: isListening && pitch ? Math.max(0.15, 1.5 / Math.abs(cents || 1)) : 8, 
              ease: "linear" 
            }}
            className={cn(
              "absolute inset-0 border-[6px] border-dashed rounded-full transition-all duration-500",
              isListening && Math.abs(cents) < 5 
                ? "border-neon-blue shadow-[0_0_40px_rgba(0,240,255,0.3)]" 
                : "border-white/5"
            )}
          />
          
          {/* Inner Ring */}
          <div className="absolute inset-8 border border-white/5 rounded-full" />
          
          <div className="text-center z-10">
            <AnimatePresence mode="wait">
              {note ? (
                <motion.div 
                  key={note}
                  initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                  className="flex flex-col items-center"
                >
                  <span className={cn(
                    "text-8xl lg:text-9xl font-bold tracking-tighter leading-none transition-all duration-300",
                    Math.abs(cents) < 5 ? "text-neon-blue drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]" : "text-white/80"
                  )}>
                    {note}
                  </span>
                  <div className={cn(
                    "mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    Math.abs(cents) < 5 ? "bg-neon-blue/20 text-neon-blue" : "bg-white/5 text-white/20"
                  )}>
                    {cents > 0 ? `+${cents}` : cents} cents
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Music className="w-16 h-16 text-white/5" />
                  <p className="text-[10px] text-white/10 uppercase tracking-widest font-bold">Waiting for input</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Cents Meter */}
      <div className="w-full max-w-xs h-3 bg-white/5 rounded-full relative mb-12 overflow-hidden border border-white/5">
        <motion.div 
          animate={{ x: `${50 + (cents / 2)}%` }}
          className={cn(
            "absolute top-0 bottom-0 w-1.5 transition-colors duration-300",
            Math.abs(cents) < 5 ? "bg-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.8)]" : "bg-white/20"
          )}
        />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
        {/* Scale Markers */}
        <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
          {[...Array(11)].map((_, i) => (
            <div key={i} className={cn("w-px h-full", i === 5 ? "bg-white/20" : "bg-white/5")} />
          ))}
        </div>
      </div>

      <button 
        onClick={toggleTuner}
        className={cn(
          "w-full max-w-xs py-5 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl",
          isListening 
            ? "bg-red-500 text-white shadow-red-500/20" 
            : "bg-neon-blue text-black shadow-neon-blue/30 hover:bg-white"
        )}
      >
        {isListening ? (
          <><MicOff className="w-5 h-5" /> Deactivate Engine</>
        ) : (
          <><Mic className="w-5 h-5" /> Initialize Tuner</>
        )}
      </button>

      {!isListening && (
        <p className="text-[10px] text-white/20 mt-6 uppercase tracking-[0.2em] font-bold">
          Microphone access required for analysis
        </p>
      )}

      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    </div>
  );
}
