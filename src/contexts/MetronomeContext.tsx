import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

interface MetronomeContextType {
  bpm: number;
  setBpm: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  togglePlay: () => void;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  subdivision: '4' | '8';
  setSubdivision: React.Dispatch<React.SetStateAction<'4' | '8'>>;
  beat: number;
  handleTap: () => void;
  bpmHistory: number[];
}

const MetronomeContext = createContext<MetronomeContextType | undefined>(undefined);

export function MetronomeProvider({ children }: { children: React.ReactNode }) {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [subdivision, setSubdivision] = useState<'4' | '8'>('4');
  const [beat, setBeat] = useState(0);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [bpmHistory, setBpmHistory] = useState<number[]>([]);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);

  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);
  const beatRef = useRef(beat);
  const volumeRef = useRef(volume);
  const subdivisionRef = useRef(subdivision);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { beatRef.current = beat; }, [beat]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { subdivisionRef.current = subdivision; }, [subdivision]);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    if (!audioContext.current || isMutedRef.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    const isAccent = beatNumber % (subdivisionRef.current === '8' ? 8 : 4) === 0;
    const isOffbeat = subdivisionRef.current === '8' && beatNumber % 2 !== 0;

    osc.frequency.value = isAccent ? 1000 : (isOffbeat ? 600 : 800);
    envelope.gain.value = (isOffbeat ? 0.3 : 1) * volumeRef.current;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      scheduleNote(beatRef.current, nextNoteTime.current);
      
      const secondsPerBeat = 60.0 / bpmRef.current;
      const interval = subdivisionRef.current === '8' ? secondsPerBeat / 2 : secondsPerBeat;
      nextNoteTime.current += interval;
      
      const maxBeats = subdivisionRef.current === '8' ? 8 : 4;
      const nextBeat = (beatRef.current + 1) % maxBeats;
      beatRef.current = nextBeat;
      setBeat(nextBeat);
    }
    timerID.current = window.setTimeout(scheduler, 25.0);
  }, [scheduleNote]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      setIsPlaying(true);
      setBeat(0);
      beatRef.current = 0;
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
    } else {
      setIsPlaying(false);
      if (timerID.current) window.clearTimeout(timerID.current);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].filter(t => now - t < 2000);
    
    if (newTapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      if (newBpm >= 40 && newBpm <= 280) {
        setBpm(newBpm);
        setBpmHistory(prev => {
          if (prev[0] === newBpm) return prev; // Don't add same BPM twice in a row
          return [newBpm, ...prev].slice(0, 3);
        });
      }
    }
    setTapTimes(newTapTimes);
  };

  useEffect(() => {
    return () => {
      if (timerID.current) window.clearTimeout(timerID.current);
    };
  }, []);

  return (
    <MetronomeContext.Provider value={{
      bpm, setBpm, isPlaying, togglePlay, isMuted, setIsMuted, volume, setVolume, subdivision, setSubdivision, beat, handleTap, bpmHistory
    }}>
      {children}
    </MetronomeContext.Provider>
  );
}

export function useMetronome() {
  const context = useContext(MetronomeContext);
  if (context === undefined) {
    throw new Error('useMetronome must be used within a MetronomeProvider');
  }
  return context;
}
