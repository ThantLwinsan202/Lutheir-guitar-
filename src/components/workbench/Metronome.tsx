import React from 'react';
import { Play, Pause, Plus, Minus, Volume2, VolumeX, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useMetronome } from '../../contexts/MetronomeContext';

export default function Metronome() {
  const {
    bpm, setBpm, isPlaying, togglePlay, isMuted, setIsMuted, volume, setVolume, subdivision, setSubdivision, beat, handleTap, bpmHistory
  } = useMetronome();

  return (
    <div className="glass-panel p-6 lg:p-10 flex flex-col items-center relative overflow-hidden group rounded-2xl lg:rounded-3xl shadow-2xl">
      {/* Visual Pulse Background */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            key={beat}
            initial={{ opacity: 0.1, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "absolute inset-0 pointer-events-none",
              beat % (subdivision === '8' ? 2 : 1) === 0 
                ? (beat === 0 ? "bg-neon-orange/20" : "bg-neon-blue/10") 
                : "transparent"
            )}
          />
        )}
      </AnimatePresence>

      {/* Hardware Accents */}
      <div className="absolute top-4 right-4 flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
      </div>
      
      <div className="mb-10 text-center relative z-10">
        <h4 className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold mb-6">Precision Metronome</h4>
        <div className="flex items-center justify-center gap-6 lg:gap-8">
          <button 
            onClick={() => setBpm(prev => Math.max(40, prev - 1))}
            className="p-3 glass-panel hover:border-neon-orange/50 transition-all rounded-xl active:scale-90"
          >
            <Minus className="w-5 h-5 text-white/40 group-hover:text-white" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-7xl lg:text-8xl font-bold text-white tracking-tighter tabular-nums leading-none">{bpm}</span>
            <p className="text-[10px] text-white/20 mt-4 font-bold uppercase tracking-[0.2em]">Beats Per Minute</p>
          </div>
          <button 
            onClick={() => setBpm(prev => Math.min(280, prev + 1))}
            className="p-3 glass-panel hover:border-neon-orange/50 transition-all rounded-xl active:scale-90"
          >
            <Plus className="w-5 h-5 text-white/40 group-hover:text-white" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white">{Math.floor(beat / (subdivision === '8' ? 2 : 1)) + 1}</span>
          <span className="text-xl font-bold text-white/20">/ 4</span>
        </div>
        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mt-1">Current Beat</p>
      </div>

      <div className="flex gap-3 lg:gap-4 mb-12 relative z-10">
        {(subdivision === '8' ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3]).map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: isPlaying && beat === (i + 1) % (subdivision === '8' ? 8 : 4) ? 1.25 : 1,
              backgroundColor: isPlaying && beat === (i + 1) % (subdivision === '8' ? 8 : 4) 
                ? (i === (subdivision === '8' ? 7 : 3) ? '#FF6321' : '#00F0FF') 
                : 'rgba(255, 255, 255, 0.05)',
              boxShadow: isPlaying && beat === (i + 1) % (subdivision === '8' ? 8 : 4) 
                ? `0 0 20px ${i === (subdivision === '8' ? 7 : 3) ? '#FF632140' : '#00F0FF40'}` 
                : 'none'
            }}
            className={cn(
              "rounded-full border border-white/5",
              subdivision === '8' ? "w-2.5 h-2.5" : "w-4 h-4"
            )}
          />
        ))}
      </div>

      <div className="w-full max-w-[200px] mb-10 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Volume</span>
          <span className="text-[10px] font-bold text-white/40">{Math.round(volume * 100)}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-neon-orange"
        />
      </div>

      <div className="flex gap-6 relative z-10">
        <button 
          onClick={() => setSubdivision(subdivision === '4' ? '8' : '4')}
          className={cn(
            "w-20 h-20 glass-panel rounded-full flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl group",
            subdivision === '8' ? "border-neon-blue/50" : ""
          )}
        >
          <span className="text-[10px] font-bold text-white/40 group-hover:text-neon-blue uppercase tracking-widest">Sub</span>
          <span className={cn(
            "text-lg font-black mt-1",
            subdivision === '8' ? "text-neon-blue" : "text-white/20"
          )}>{subdivision === '4' ? '1/4' : '1/8'}</span>
        </button>
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={handleTap}
            className="w-20 h-20 glass-panel rounded-full flex flex-col items-center justify-center hover:border-neon-orange/50 transition-all active:scale-95 shadow-xl group"
          >
            <span className="text-[10px] font-bold text-white/40 group-hover:text-neon-orange uppercase tracking-widest">Tap</span>
            <Clock className="w-5 h-5 text-white/20 group-hover:text-neon-orange mt-1" />
          </button>
          <div className="flex gap-1 h-6">
            <AnimatePresence>
              {bpmHistory.map((hBpm, idx) => (
                <motion.button
                  key={`${hBpm}-${idx}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setBpm(hBpm)}
                  className="px-2 py-0.5 glass-panel rounded-md text-[9px] font-bold text-white/30 hover:text-neon-orange hover:border-neon-orange/30 transition-all"
                >
                  {hBpm}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <button 
          onClick={togglePlay}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl",
            isPlaying 
              ? "bg-red-500 text-white shadow-red-500/30" 
              : "bg-neon-orange text-white shadow-neon-orange/30"
          )}
        >
          {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1.5" />}
        </button>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="w-20 h-20 glass-panel rounded-full flex items-center justify-center hover:border-white/20 transition-all active:scale-95 shadow-xl"
        >
          {isMuted ? <VolumeX className="w-7 h-7 text-white/20" /> : <Volume2 className="w-7 h-7 text-white/60" />}
        </button>
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    </div>
  );
}
