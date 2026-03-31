import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { ChordVoicing } from '../../types';

interface FretboardProps {
  voicing: ChordVoicing;
  className?: string;
  compact?: boolean;
}

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
const FRET_COUNT = 5;

export default function Fretboard({ voicing, className, compact }: FretboardProps) {
  const { frets, fingers, baseFret } = voicing;

  return (
    <div className={cn(
      "flex flex-col items-center glass-panel",
      compact ? "p-3 rounded-xl" : "p-6 rounded-3xl",
      className
    )}>
      {!compact && (
        <div className="mb-4 text-center">
          <h4 className="text-xl font-bold text-neon-orange tracking-tight">{voicing.name}</h4>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Fret {baseFret}</p>
        </div>
      )}

      <div className="relative">
        {/* Nut / Top Border */}
        <div className={cn(
          "absolute top-0 left-0 right-0 bg-white/40 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]",
          compact ? "h-1" : "h-1.5"
        )} />

        <div className={cn("flex", compact ? "gap-2" : "gap-4")}>
          {STRINGS.map((stringName, stringIdx) => {
            const fret = frets[stringIdx];
            const finger = fingers[stringIdx];
            const isMuted = fret === null;
            const isOpen = fret === 0;

            return (
              <div key={stringIdx} className="flex flex-col items-center relative">
                {/* String Label */}
                <span className={cn(
                  "font-bold text-white/40 uppercase tracking-wider",
                  compact ? "text-[8px] mb-1" : "text-[11px] mb-3"
                )}>{stringName}</span>

                {/* Mute / Open Indicator */}
                <div className={cn("flex items-center justify-center mb-1", compact ? "h-2" : "h-4")}>
                  {isMuted && <span className={cn("text-red-500/50 font-bold", compact ? "text-[8px]" : "text-[10px]")}>×</span>}
                  {isOpen && <div className={cn("rounded-full border border-neon-blue/50", compact ? "w-1 h-1" : "w-1.5 h-1.5")} />}
                </div>

                {/* String Line */}
                <div className={cn("bg-white/10 relative", compact ? "w-px h-20" : "w-0.5 h-40")}>
                  {/* Fret Markers */}
                  {[...Array(FRET_COUNT)].map((_, fIdx) => (
                    <div 
                      key={fIdx} 
                      className={cn(
                        "absolute bg-white/5",
                        compact ? "w-4 h-px -left-[7px]" : "w-8 h-px -left-[15px]"
                      )} 
                      style={{ top: `${(fIdx + 1) * (100 / FRET_COUNT)}%` }}
                    />
                  ))}

                  {/* Finger Position */}
                  {!isMuted && !isOpen && fret !== undefined && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute rounded-full bg-neon-blue flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)] z-10 border border-white/20",
                        compact ? "w-4 h-4 -left-[8px]" : "w-7 h-7 -left-[13px]"
                      )}
                      style={{ 
                        top: `${(fret - baseFret + 0.5) * (100 / FRET_COUNT)}%`,
                        transform: 'translateY(-50%)'
                      }}
                    >
                      <span className={cn(
                        "font-black text-black drop-shadow-sm", 
                        compact ? "text-[8px]" : "text-[14px]"
                      )}>
                        {finger}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {compact && (
        <p className="mt-2 text-[8px] text-white/20 uppercase font-bold">Fret {baseFret}</p>
      )}
    </div>
  );
}
