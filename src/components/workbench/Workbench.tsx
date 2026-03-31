import React from 'react';
import { Activity, Music, Clock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import Metronome from './Metronome';
import Tuner from './Tuner';

export default function Workbench() {
  return (
    <div className="flex flex-col gap-12 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-shadow rounded-[2.5rem]"
        >
          <Tuner />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-shadow rounded-[2.5rem]"
        >
          <Metronome />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-8 flex items-start gap-6 shadow-xl">
          <div className="p-4 rounded-2xl bg-neon-orange/10 text-neon-orange shadow-inner">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h5 className="text-xl font-bold mb-2 text-white">Strobe Precision</h5>
            <p className="text-base text-white/40 leading-relaxed">High-accuracy pitch detection for perfect intonation and tuning stability.</p>
          </div>
        </div>
        <div className="glass-panel p-8 flex items-start gap-6 shadow-xl">
          <div className="p-4 rounded-2xl bg-neon-blue/10 text-neon-blue shadow-inner">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h5 className="text-xl font-bold mb-2 text-white">Steady Rhythm</h5>
            <p className="text-base text-white/40 leading-relaxed">Programmable metronome with visual beat indicators and precise timing.</p>
          </div>
        </div>
        <div className="glass-panel p-8 flex items-start gap-6 shadow-xl">
          <div className="p-4 rounded-2xl bg-white/5 text-white/40 shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h5 className="text-xl font-bold mb-2 text-white">Live Engine</h5>
            <p className="text-base text-white/40 leading-relaxed">Real-time audio processing powered by advanced Web Audio API technology.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
