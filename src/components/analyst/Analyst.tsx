import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileAudio, Loader2, Music, Activity, Sparkles, ChevronRight, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeAudio } from '../../services/geminiService';
import { cn } from '../../lib/utils';
import { db } from '../../firebase';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface AnalysisResult {
  key: string;
  bpm: number;
  chords: string[];
  mood: string;
}

interface HistoryItem extends AnalysisResult {
  id: string;
  title: string;
  timestamp: number;
}

export default function Analyst({ user }: { user: User | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewingTitle, setViewingTitle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount or user change
  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        try {
          const q = query(
            collection(db, 'sessions'),
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const firestoreHistory: HistoryItem[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              key: data.key,
              bpm: data.bpm,
              chords: data.chords,
              mood: data.mood,
              timestamp: data.createdAt?.toMillis() || Date.now()
            };
          });
          setHistory(firestoreHistory);
        } catch (err) {
          console.error("Error loading history from Firestore:", err);
          // Fallback to localStorage if Firestore fails
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      const saved = localStorage.getItem('analyst_history');
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing local history:", e);
        }
      }
    };

    loadHistory();
  }, [user]);

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('analyst_history', JSON.stringify(history.slice(0, 20)));
    }
  }, [history]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
    reader.onerror = error => reject(error);
  });

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const base64 = await toBase64(file);
      const data = await analyzeAudio(base64, file.type);
      setResult(data);
      setViewingTitle(file.name);
      
      // Add to history
      const newItem: HistoryItem = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        title: file.name,
        timestamp: Date.now(),
      };

      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'sessions'), {
            uid: user.uid,
            title: file.name,
            key: data.key,
            bpm: data.bpm,
            chords: data.chords,
            mood: data.mood,
            createdAt: serverTimestamp()
          });
          newItem.id = docRef.id;
        } catch (err) {
          console.error("Error saving to Firestore:", err);
        }
      }

      setHistory(prev => [newItem, ...prev].slice(0, 20));
    } catch (err) {
      console.error("Analysis Error:", err);
      setError("Failed to analyze the track. Please ensure it's a valid audio file and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResult({
      key: item.key,
      bpm: item.bpm,
      chords: item.chords,
      mood: item.mood
    });
    setViewingTitle(item.title);
    setFile(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = async () => {
    if (confirm("Are you sure you want to clear your analysis history?")) {
      if (user) {
        try {
          // In a real app, we might want to delete all docs for this user.
          // For simplicity here, we'll just clear the local state and localStorage.
          // Deleting multiple docs in Firestore requires a batch or individual deletes.
          const q = query(collection(db, 'sessions'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, 'sessions', d.id)));
          await Promise.all(deletePromises);
        } catch (err) {
          console.error("Error clearing Firestore history:", err);
        }
      }
      setHistory([]);
      localStorage.removeItem('analyst_history');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col gap-12 max-w-[1600px] mx-auto">
      <div className="glass-panel p-10 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] relative overflow-hidden group premium-shadow">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-blue/5 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <h3 className="text-4xl lg:text-6xl font-bold mb-6 tracking-tighter text-white neon-text-glow">Audio Intelligence</h3>
          <p className="text-white/40 max-w-2xl text-base lg:text-xl mb-12 leading-relaxed">
            Upload any audio file and Luthier will analyze its key, tempo, and chord progression using advanced AI algorithms.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-[2rem] lg:rounded-[3rem] p-16 lg:p-24 flex flex-col items-center justify-center transition-all cursor-pointer group/upload shadow-inner",
              isDragging ? "border-neon-blue bg-neon-blue/5 scale-[0.99]" : "border-white/5 hover:border-white/20 bg-white/[0.01]"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />
            
            <div className={cn(
              "p-8 rounded-3xl mb-8 transition-all duration-500 shadow-2xl",
              isDragging ? "bg-neon-blue text-black scale-110" : "bg-white/5 text-white/20 group-hover/upload:text-neon-blue group-hover/upload:bg-neon-blue/10"
            )}>
              <Upload className="w-12 h-12" />
            </div>
            
            <h4 className="text-2xl lg:text-3xl font-bold mb-3 text-white">
              {file ? file.name : viewingTitle ? viewingTitle : "Drop audio file here"}
            </h4>
            <p className="text-sm text-white/20 uppercase tracking-[0.3em] font-bold">
              MP3, WAV, or M4A up to 20MB
            </p>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-void-black bg-white/10 flex items-center justify-center shadow-lg">
                    <Music className="w-4 h-4 text-white/30" />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/20 uppercase tracking-[0.2em] font-bold">
                1,240+ tracks analyzed today
              </p>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className={cn(
                "w-full sm:w-auto px-12 py-5 rounded-2xl lg:rounded-3xl font-bold text-base lg:text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]",
                file && !isAnalyzing 
                  ? "bg-neon-blue text-black shadow-neon-blue/30 hover:bg-white" 
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              )}
            >
              {isAnalyzing ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
              ) : (
                <><Activity className="w-6 h-6" /> Run Analysis</>
              )}
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <ResultCard label="Detected Key" value={result.key} icon={<Music className="w-6 h-6" />} color="neon-blue" />
            <ResultCard label="Estimated BPM" value={`${result.bpm} BPM`} icon={<Activity className="w-6 h-6" />} color="neon-orange" />
            <ResultCard label="Vibe / Mood" value={result.mood} icon={<Sparkles className="w-6 h-6" />} color="neon-blue" />

            <div className="md:col-span-3 glass-panel p-10 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl premium-shadow">
              <div className="flex items-center justify-between mb-12">
                <h4 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Chord Progression</h4>
                <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">
                  AI Generated
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                {result.chords.map((chord, idx) => (
                  <div key={idx} className="flex items-center gap-6">
                    <div className="px-8 py-6 glass-panel border-neon-orange/20 hover:border-neon-orange/50 transition-all rounded-2xl lg:rounded-3xl group cursor-default shadow-xl">
                      <span className="text-3xl font-bold text-white group-hover:text-neon-orange transition-colors">{chord}</span>
                    </div>
                    {idx < result.chords.length - 1 && (
                      <div className="w-6 h-px bg-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h4 className="text-2xl font-bold text-white tracking-tight">Analysis History</h4>
              <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Recent Tracks</span>
            </div>
            <button 
              onClick={clearHistory}
              className="flex items-center gap-2 text-[10px] text-white/20 hover:text-red-500 uppercase tracking-widest font-bold transition-colors"
            >
              <Trash2 size={12} />
              Clear History
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="glass-panel p-6 rounded-2xl lg:rounded-3xl text-left transition-all flex items-center justify-between group active:scale-[0.99] hover:border-white/20"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-neon-blue/10 transition-colors">
                    <FileAudio className="w-6 h-6 text-white/20 group-hover:text-neon-blue" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white mb-1 group-hover:text-neon-blue transition-colors">{item.title}</h5>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{item.key}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{item.bpm} BPM</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: 'neon-orange' | 'neon-blue' }) {
  return (
    <div className="glass-panel p-6 relative overflow-hidden">
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full -mr-12 -mt-12 opacity-10",
        color === 'neon-orange' ? "bg-neon-orange" : "bg-neon-blue"
      )} />
      <div className={cn(
        "p-3 rounded-xl mb-4 w-fit",
        color === 'neon-orange' ? "bg-neon-orange/10 text-neon-orange" : "bg-neon-blue/10 text-neon-blue"
      )}>
        {icon}
      </div>
      <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-1">{label}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  );
}
