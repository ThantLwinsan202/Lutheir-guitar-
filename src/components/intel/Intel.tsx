import React, { useState, useEffect } from 'react';
import { Search, Plus, Save, Trash2, Library, Sparkles, Music, Wand2, Play, Pause, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Fretboard from './Fretboard';
import { ChordVoicing } from '../../types';
import { cn } from '../../lib/utils';
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SAMPLE_CHORDS: ChordVoicing[] = [
  { name: "C Major", frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null], baseFret: 1 },
  { name: "G Major", frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, null, null, null, 4], baseFret: 1 },
  { name: "A Minor", frets: [null, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null], baseFret: 1 },
  { name: "D Minor 7", frets: [null, null, 0, 2, 1, 1], fingers: [null, null, null, 2, 1, 1], baseFret: 1 },
  { name: "E Major", frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null], baseFret: 1 },
  { name: "Fmaj7", frets: [null, null, 3, 2, 1, 0], fingers: [null, null, 3, 2, 1, null], baseFret: 1 },
  { name: "B half-dim", frets: [null, 2, 3, 2, 3, null], fingers: [null, 1, 3, 2, 4, null], baseFret: 1 },
  { name: "G7", frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1], baseFret: 1 },
  { name: "D Major", frets: [null, null, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2], baseFret: 1 },
  { name: "E Minor", frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null], baseFret: 1 },
  { name: "A Major", frets: [null, 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null], baseFret: 1 },
  { name: "B Minor", frets: [null, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], baseFret: 2 },
  { name: "F# Minor", frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2 },
  { name: "C# Minor", frets: [null, 4, 6, 6, 5, 4], fingers: [null, 1, 3, 4, 2, 1], baseFret: 4 },
  { name: "G# Minor", frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4 },
  { name: "F Major", frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1 },
  { name: "Bb Major", frets: [null, 1, 3, 3, 3, 1], fingers: [null, 1, 2, 3, 4, 1], baseFret: 1 },
  { name: "Eb Major", frets: [null, 6, 8, 8, 8, 6], fingers: [null, 1, 2, 3, 4, 1], baseFret: 6 },
  { name: "B Major", frets: [null, 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1], baseFret: 2 },
  { name: "D# Minor", frets: [null, 6, 8, 8, 7, 6], fingers: [null, 1, 3, 4, 2, 1], baseFret: 6 },
  { name: "G Minor", frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3 },
  { name: "D Minor", frets: [null, null, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1], baseFret: 1 },
];

const CHORD_FAMILIES = [
  { key: "C Major", chords: ["C Major", "D Minor 7", "E Minor", "F Major", "G7", "A Minor", "B half-dim"] },
  { key: "G Major", chords: ["G Major", "A Minor", "B Minor", "C Major", "D Major", "E Minor", "F# Minor"] },
  { key: "D Major", chords: ["D Major", "E Minor", "F# Minor", "G Major", "A Major", "B Minor", "C# Minor"] },
  { key: "A Major", chords: ["A Major", "B Minor", "C# Minor", "D Major", "E Major", "F# Minor", "G# Minor"] },
  { key: "E Major", chords: ["E Major", "F# Minor", "G# Minor", "A Major", "B Major", "C# Minor", "D# Minor"] },
  { key: "F Major", chords: ["F Major", "G Minor", "A Minor", "Bb Major", "C Major", "D Minor", "E Minor"] },
];

export default function Intel() {
  const [search, setSearch] = useState('');
  const [selectedChord, setSelectedChord] = useState<ChordVoicing | null>(SAMPLE_CHORDS[0]);
  const [savedChords, setSavedChords] = useState<ChordVoicing[]>([]);
  const [customChords, setCustomChords] = useState<ChordVoicing[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChord, setNewChord] = useState<ChordVoicing & { description?: string }>({
    name: '',
    frets: [null, null, null, null, null, null],
    fingers: [null, null, null, null, null, null],
    baseFret: 1,
    description: ''
  });
  const [viewMode, setViewMode] = useState<'library' | 'families'>('library');
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [variations, setVariations] = useState<(ChordVoicing & { description: string })[]>([]);
  const [progressions, setProgressions] = useState<{ name: string; chords: string[]; description: string }[]>([]);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isGeneratingProgressions, setIsGeneratingProgressions] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [jamTrackUrl, setJamTrackUrl] = useState<string | null>(null);
  const [isPlayingJamTrack, setIsPlayingJamTrack] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const generateVariations = async () => {
    if (!selectedChord) return;
    setIsGeneratingVariations(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 3 distinct guitar chord voicing variations for "${selectedChord.name}". 
        Return as a JSON array of objects with:
        - name: string (e.g. "C Major (Open)", "C Major (Barre)")
        - frets: (number | null)[] (length 6, null for muted)
        - fingers: (number | null)[] (length 6)
        - baseFret: number
        - description: string (brief mood/complexity description)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                frets: { type: Type.ARRAY, items: { type: Type.INTEGER, nullable: true } },
                fingers: { type: Type.ARRAY, items: { type: Type.INTEGER, nullable: true } },
                baseFret: { type: Type.INTEGER },
                description: { type: Type.STRING }
              },
              required: ["name", "frets", "fingers", "baseFret", "description"]
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setVariations(data);
    } catch (error) {
      console.error("Failed to generate variations:", error);
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const generateProgressions = async () => {
    if (!selectedChord) return;
    setIsGeneratingProgressions(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate at least 3 common musical chord progressions that include the chord "${selectedChord.name}". 
        Return as a JSON array of objects with:
        - name: string (e.g. "I-IV-V Blues", "Jazz 2-5-1")
        - chords: string[] (array of chord names, e.g. ["C", "F", "G"])
        - description: string (brief description of the progression's feel or use case)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                chords: { type: Type.ARRAY, items: { type: Type.STRING } },
                description: { type: Type.STRING }
              },
              required: ["name", "chords", "description"]
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setProgressions(data);
    } catch (error) {
      console.error("Failed to generate progressions:", error);
    } finally {
      setIsGeneratingProgressions(false);
    }
  };

  const generateJamTrack = async () => {
    if (!selectedChord) return;
    setIsGeneratingMusic(true);
    try {
      const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: `Generate a 15-second ambient guitar jam track in the key of ${selectedChord.name.split(' ')[0]} that matches the mood of a ${selectedChord.name} chord.`,
      });

      let audioBase64 = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
        }
      }

      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setJamTrackUrl(url);
    } catch (error) {
      console.error("Failed to generate music:", error);
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const toggleJamTrack = () => {
    if (!audioRef.current) return;
    if (isPlayingJamTrack) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlayingJamTrack(!isPlayingJamTrack);
  };

  useEffect(() => {
    setVariations([]);
    setProgressions([]);
    setJamTrackUrl(null);
    setIsPlayingJamTrack(false);

    if (selectedChord) {
      const timer = setTimeout(() => {
        generateProgressions();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [selectedChord]);

  const filteredChords = [...SAMPLE_CHORDS, ...customChords].filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateChord = () => {
    if (!newChord.name) return;
    setCustomChords(prev => [...prev, newChord]);
    setSelectedChord(newChord);
    setShowCreateModal(false);
    setNewChord({
      name: '',
      frets: [null, null, null, null, null, null],
      fingers: [null, null, null, null, null, null],
      baseFret: 1,
      description: ''
    });
  };

  const updateNewChordFret = (stringIdx: number, fret: number | null) => {
    const nextFrets = [...newChord.frets];
    nextFrets[stringIdx] = fret;
    setNewChord(prev => ({ ...prev, frets: nextFrets }));
  };

  const updateNewChordFinger = (stringIdx: number, finger: number | null) => {
    const nextFingers = [...newChord.fingers];
    nextFingers[stringIdx] = finger;
    setNewChord(prev => ({ ...prev, fingers: nextFingers }));
  };

  const toggleSave = (chord: ChordVoicing) => {
    if (savedChords.some(c => c.name === chord.name)) {
      setSavedChords(prev => prev.filter(c => c.name !== chord.name));
    } else {
      setSavedChords(prev => [...prev, chord]);
    }
  };

  const findChordByName = (name: string) => {
    const allChords = [...SAMPLE_CHORDS, ...customChords, ...savedChords, ...variations];
    // Try exact match
    let found = allChords.find(c => c.name.toLowerCase() === name.toLowerCase());
    // Try partial match (e.g. "C" -> "C Major")
    if (!found) {
      found = allChords.find(c => c.name.toLowerCase().startsWith(name.toLowerCase()));
    }
    return found;
  };

  const handleChordClick = (chordName: string) => {
    const found = findChordByName(chordName);
    if (found) {
      setSelectedChord(found);
    } else {
      // Create a placeholder if not found
      setSelectedChord({ 
        name: chordName, 
        frets: [null, null, null, null, null, null], 
        fingers: [null, null, null, null, null, null], 
        baseFret: 1 
      });
    }
    // Scroll to top if in library mode to see the main display
    if (viewMode === 'library') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentFamilyChords = selectedFamily 
    ? CHORD_FAMILIES.find(f => f.key === selectedFamily)?.chords.map(name => 
        findChordByName(name) || { name, frets: [null, null, null, null, null, null], fingers: [null, null, null, null, null, null], baseFret: 1 } as ChordVoicing
      ) || []
    : [];

  const chordFamilies = selectedChord 
    ? CHORD_FAMILIES.filter(f => f.chords.includes(selectedChord.name)).map(f => f.key)
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 h-full max-w-[1600px] mx-auto pb-12">
      {/* Chord List & Search */}
      <div className="w-full lg:w-96 xl:w-[450px] flex flex-col gap-8 shrink-0">
        <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
          <button 
            onClick={() => setViewMode('library')}
            className={cn(
              "flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all",
              viewMode === 'library' ? "bg-neon-orange text-black shadow-lg shadow-neon-orange/20" : "text-white/40 hover:text-white"
            )}
          >
            Library
          </button>
          <button 
            onClick={() => setViewMode('families')}
            className={cn(
              "flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all",
              viewMode === 'families' ? "bg-neon-orange text-black shadow-lg shadow-neon-orange/20" : "text-white/40 hover:text-white"
            )}
          >
            Families
          </button>
        </div>

        {viewMode === 'library' ? (
          <>
            <div className="glass-panel p-3 flex items-center gap-4 border-white/10 focus-within:border-neon-orange/50 transition-all rounded-2xl lg:rounded-3xl shadow-2xl backdrop-blur-3xl">
              <Search className="w-6 h-6 text-white/20 ml-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chords..."
                className="flex-1 bg-transparent border-none outline-none text-base lg:text-lg py-3.5 text-white placeholder:text-white/20"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide max-h-[40vh] lg:max-h-none">
              <div className="flex items-center justify-between px-4 mb-6">
                <h4 className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-bold">All Intel</h4>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 rounded-lg bg-neon-orange/10 text-neon-orange hover:bg-neon-orange hover:text-black transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {filteredChords.map((chord, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedChord(chord)}
                    className={cn(
                      "w-full p-5 lg:p-6 rounded-2xl lg:rounded-3xl text-left transition-all flex items-center justify-between group active:scale-[0.98] shadow-lg",
                      selectedChord?.name === chord.name 
                        ? "bg-neon-orange text-white shadow-neon-orange/30 premium-shadow" 
                        : "glass-panel hover:border-white/20 text-white/60"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Music className={cn("w-5 h-5", selectedChord?.name === chord.name ? "text-white" : "text-neon-orange")} />
                      <span className="font-bold tracking-tight text-base lg:text-lg">{chord.name}</span>
                    </div>
                    <ChevronRight className={cn("w-5 h-5 transition-all", selectedChord?.name === chord.name ? "text-white" : "text-white/20")} />
                  </button>
                ))}
              </div>
              
              {savedChords.length > 0 && (
                <>
                  <h4 className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-bold px-4 mt-12 mb-6">Saved Intel</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {savedChords.map((chord, idx) => (
                      <button
                        key={`saved-${idx}`}
                        onClick={() => setSelectedChord(chord)}
                        className={cn(
                          "w-full p-5 lg:p-6 rounded-2xl lg:rounded-3xl text-left transition-all flex items-center justify-between group active:scale-[0.98] shadow-lg",
                          selectedChord?.name === chord.name 
                            ? "bg-neon-blue text-white shadow-neon-blue/30 premium-shadow" 
                            : "glass-panel border-neon-blue/10 hover:border-neon-blue/30 text-white/60"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <Sparkles className={cn("w-5 h-5", selectedChord?.name === chord.name ? "text-white" : "text-neon-blue")} />
                          <span className="font-bold tracking-tight text-base lg:text-lg">{chord.name}</span>
                        </div>
                        <ChevronRight className={cn("w-5 h-5 transition-all", selectedChord?.name === chord.name ? "text-white" : "text-white/20")} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide">
            <div className="space-y-4">
              <h4 className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-bold px-4 mb-6">Select Key</h4>
              <div className="grid grid-cols-2 gap-3">
                {CHORD_FAMILIES.map((family, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFamily(family.key)}
                    className={cn(
                      "p-4 rounded-2xl text-center transition-all font-bold tracking-tight active:scale-[0.98] shadow-lg",
                      selectedFamily === family.key 
                        ? "bg-neon-orange text-white shadow-neon-orange/30" 
                        : "glass-panel hover:border-white/20 text-white/60"
                    )}
                  >
                    {family.key}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-8">
        <AnimatePresence mode="wait">
          {viewMode === 'families' && selectedFamily ? (
            <motion.div
              key={`family-${selectedFamily}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-4xl font-bold tracking-tighter text-white mb-2">{selectedFamily} Family</h3>
                  <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Diatonic Chord Progression</p>
                </div>
                <div className="px-4 py-2 rounded-full bg-neon-orange/10 border border-neon-orange/20 text-neon-orange text-[10px] font-bold uppercase tracking-widest">
                  7 Chords Identified
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {currentFamilyChords.map((chord, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedChord(chord);
                    }}
                    className={cn(
                      "p-6 rounded-[2.5rem] transition-all flex flex-col items-center gap-6 group active:scale-[0.98] shadow-2xl relative overflow-hidden border border-white/5",
                      selectedChord?.name === chord.name 
                        ? "bg-neon-orange/10 border-neon-orange/50 shadow-neon-orange/10" 
                        : "glass-panel hover:border-white/20"
                    )}
                  >
                    {/* Degree Indicator */}
                    <div className={cn(
                      "absolute top-4 left-4 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black",
                      selectedChord?.name === chord.name ? "bg-neon-orange text-white" : "bg-white/5 text-white/20"
                    )}>
                      {['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'][idx] || idx + 1}
                    </div>

                    <div className="mt-4">
                      <Fretboard voicing={chord} compact className="border-none bg-transparent shadow-none p-0" />
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className={cn(
                        "font-bold tracking-tight text-xl transition-colors",
                        selectedChord?.name === chord.name ? "text-neon-orange" : "text-white"
                      )}>{chord.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold mt-2 text-white/20">
                        {idx === 0 ? 'Tonic' : idx === 4 ? 'Dominant' : 'Diatonic'}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {selectedChord && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 glass-panel p-8 rounded-[3rem] border-white/10 flex flex-col lg:flex-row items-center gap-12"
                >
                  <Fretboard voicing={selectedChord} className="w-full max-w-[280px] border-none bg-transparent shadow-none" />
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-4xl font-bold tracking-tighter text-white">{selectedChord.name}</h4>
                        {selectedChord.description && (
                          <p className="text-sm text-white/40 italic">{selectedChord.description}</p>
                        )}
                      </div>
                      <button 
                        onClick={() => toggleSave(selectedChord)}
                        className={cn(
                          "p-4 rounded-2xl transition-all active:scale-95",
                          savedChords.some(c => c.name === selectedChord.name) ? "bg-red-500/10 text-red-500" : "bg-neon-blue/10 text-neon-blue"
                        )}
                      >
                        {savedChords.some(c => c.name === selectedChord.name) ? <Trash2 size={24} /> : <Save size={24} />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-white/20 uppercase font-bold mb-1">Complexity</p>
                        <p className="text-lg font-bold text-neon-orange">Medium</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-white/20 uppercase font-bold mb-1">Mood</p>
                        <p className="text-lg font-bold text-neon-blue">Bright</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={generateVariations}
                        disabled={isGeneratingVariations}
                        className="flex-1 min-w-[140px] py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                      >
                        {isGeneratingVariations ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Variations
                      </button>
                      <button 
                        onClick={generateProgressions}
                        disabled={isGeneratingProgressions}
                        className="flex-1 min-w-[140px] py-4 bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/20 rounded-2xl font-bold text-sm text-neon-blue flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                      >
                        {isGeneratingProgressions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Library className="w-4 h-4" />}
                        Progressions
                      </button>
                      <button 
                        onClick={generateJamTrack}
                        disabled={isGeneratingMusic}
                        className="flex-1 min-w-[140px] py-4 bg-neon-orange/10 hover:bg-neon-orange/20 border border-neon-orange/20 rounded-2xl font-bold text-sm text-neon-orange flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                      >
                        {isGeneratingMusic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                        {jamTrackUrl ? 'Regenerate Jam' : 'Generate Jam'}
                      </button>
                    </div>

                    {jamTrackUrl && (
                      <div className="p-4 rounded-2xl bg-neon-orange/5 border border-neon-orange/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-neon-orange/20 flex items-center justify-center">
                            <Music className="w-5 h-5 text-neon-orange" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-widest">AI Jam Track</p>
                            <p className="text-[10px] text-white/40">Generated by Lyria</p>
                          </div>
                        </div>
                        <button 
                          onClick={toggleJamTrack}
                          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neon-orange hover:text-white transition-all"
                        >
                          {isPlayingJamTrack ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <audio 
                          ref={audioRef} 
                          src={jamTrackUrl} 
                          onEnded={() => setIsPlayingJamTrack(false)}
                          className="hidden" 
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {variations.length > 0 && (
                <div className="mt-12 space-y-8 w-full">
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-bold text-white tracking-tight">Voicing Variations</h4>
                    <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Generated by Gemini</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {variations.map((v, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-6 rounded-[2rem] border-white/5 flex flex-col items-center gap-6 relative group cursor-help"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-3 bg-void-gray/95 backdrop-blur-md border border-white/10 rounded-2xl text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 w-64 shadow-2xl scale-95 group-hover:scale-100 origin-bottom">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-neon-orange" />
                            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">AI Insight</span>
                          </div>
                          {v.description}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-void-gray/95" />
                        </div>

                        <Fretboard voicing={v} compact className="border-none bg-transparent shadow-none p-0" />
                        <div className="text-center">
                          <p className="font-bold text-white mb-2">{v.name}</p>
                          <p className="text-xs text-white/40 leading-relaxed line-clamp-1">{v.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {progressions.length > 0 && (
                <div className="mt-12 space-y-8 w-full">
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-bold text-white tracking-tight">Common Progressions</h4>
                    <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Generated by Gemini</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {progressions.map((p, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-8 rounded-[2.5rem] border-white/5 flex flex-col gap-6 hover:border-neon-blue/30 transition-all group relative"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white text-lg">{p.name}</p>
                          <div className="w-8 h-8 rounded-full bg-neon-blue/10 flex items-center justify-center">
                            <ChevronRight className="w-4 h-4 text-neon-blue" />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          {p.chords.map((chordName, idx) => (
                            <button 
                              key={idx}
                              onClick={() => handleChordClick(chordName)}
                              className={cn(
                                "px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95",
                                chordName.toLowerCase() === selectedChord?.name.toLowerCase() || 
                                selectedChord?.name.toLowerCase().startsWith(chordName.toLowerCase())
                                  ? "bg-neon-blue text-black shadow-lg shadow-neon-blue/20"
                                  : "bg-white/5 text-white/60 border border-white/5 hover:border-white/20"
                              )}
                            >
                              {chordName}
                            </button>
                          ))}
                        </div>

                        <p className="text-xs text-white/40 leading-relaxed italic">
                          "{p.description}"
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : selectedChord ? (
            <motion.div
              key={selectedChord.name}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col"
            >
              <div className="glass-panel p-8 lg:p-20 flex-1 flex flex-col items-center justify-center relative overflow-hidden rounded-3xl lg:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)]">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-orange/5 blur-[150px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 w-full flex flex-col items-center">
                  <h3 className="text-5xl lg:text-8xl font-bold mb-16 tracking-tighter text-white neon-text-glow">{selectedChord.name}</h3>
                  <Fretboard voicing={selectedChord} className="w-full max-w-sm border-none bg-transparent shadow-none" />
                </div>

                <div className="mt-20 flex flex-wrap justify-center gap-6 relative z-10">
                  <button 
                    onClick={() => toggleSave(selectedChord)}
                    className={cn(
                      "px-10 py-5 rounded-2xl lg:rounded-3xl font-bold text-base lg:text-lg flex items-center gap-4 transition-all active:scale-95 shadow-2xl",
                      savedChords.some(c => c.name === selectedChord.name)
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                        : "bg-neon-blue text-black hover:bg-white hover:text-black shadow-neon-blue/30"
                    )}
                  >
                    {savedChords.some(c => c.name === selectedChord.name) ? (
                      <><Trash2 className="w-6 h-6" /> Remove Intel</>
                    ) : (
                      <><Save className="w-6 h-6" /> Save Intel</>
                    )}
                  </button>
                  <button 
                    onClick={generateVariations}
                    disabled={isGeneratingVariations}
                    className="px-10 py-5 glass-panel hover:border-white/20 font-bold text-base lg:text-lg flex items-center gap-4 transition-all active:scale-95 rounded-2xl lg:rounded-3xl disabled:opacity-50"
                  >
                    {isGeneratingVariations ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
                    Variations
                  </button>
                  <button 
                    onClick={generateJamTrack}
                    disabled={isGeneratingMusic}
                    className="px-10 py-5 bg-neon-orange/10 border border-neon-orange/20 text-neon-orange hover:bg-neon-orange hover:text-white font-bold text-base lg:text-lg flex items-center gap-4 transition-all active:scale-95 rounded-2xl lg:rounded-3xl disabled:opacity-50"
                  >
                    {isGeneratingMusic ? <Loader2 className="w-6 h-6 animate-spin" /> : <Music className="w-6 h-6" />}
                    {jamTrackUrl ? 'Regenerate Jam' : 'Jam Track'}
                  </button>
                  <button 
                    onClick={generateProgressions}
                    disabled={isGeneratingProgressions}
                    className="px-10 py-5 bg-neon-blue/10 border border-neon-blue/20 text-neon-blue hover:bg-neon-blue hover:text-white font-bold text-base lg:text-lg flex items-center gap-4 transition-all active:scale-95 rounded-2xl lg:rounded-3xl disabled:opacity-50"
                  >
                    {isGeneratingProgressions ? <Loader2 className="w-6 h-6 animate-spin" /> : <Library className="w-6 h-6" />}
                    Progressions
                  </button>
                </div>

                {jamTrackUrl && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 glass-panel p-6 rounded-3xl border-neon-orange/20 flex items-center justify-between max-w-md mx-auto w-full"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-neon-orange/20 flex items-center justify-center">
                        <Music className="w-6 h-6 text-neon-orange" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-widest">AI Jam Track</p>
                        <p className="text-xs text-white/40">Generated by Lyria</p>
                      </div>
                    </div>
                    <button 
                      onClick={toggleJamTrack}
                      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-neon-orange hover:text-white transition-all shadow-xl"
                    >
                      {isPlayingJamTrack ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <audio 
                      ref={audioRef} 
                      src={jamTrackUrl} 
                      onEnded={() => setIsPlayingJamTrack(false)}
                      className="hidden" 
                    />
                  </motion.div>
                )}

                {variations.length > 0 && (
                  <div className="mt-12 space-y-8 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-bold text-white tracking-tight">Voicing Variations</h4>
                      <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Generated by Gemini</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {variations.map((v, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="glass-panel p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center gap-6 hover:border-neon-orange/30 transition-all cursor-pointer group relative"
                          onClick={() => setSelectedChord(v)}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 px-5 py-4 bg-void-gray/95 backdrop-blur-xl border border-white/10 rounded-[1.5rem] text-sm text-white/80 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 w-72 shadow-2xl scale-90 group-hover:scale-100 origin-bottom">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-neon-orange" />
                              <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">AI Insight</span>
                            </div>
                            {v.description}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-void-gray/95" />
                          </div>

                          <Fretboard voicing={v} compact className="border-none bg-transparent shadow-none p-0 group-hover:scale-105 transition-transform" />
                          <div className="text-center">
                            <p className="font-bold text-white mb-2">{v.name}</p>
                            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{v.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {progressions.length > 0 && (
                  <div className="mt-12 space-y-8 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-bold text-white tracking-tight">Common Progressions</h4>
                      <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Generated by Gemini</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {progressions.map((p, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="glass-panel p-8 rounded-[2.5rem] border-white/5 flex flex-col gap-6 hover:border-neon-blue/30 transition-all group relative"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-white text-lg">{p.name}</p>
                            <div className="w-8 h-8 rounded-full bg-neon-blue/10 flex items-center justify-center">
                              <ChevronRight className="w-4 h-4 text-neon-blue" />
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            {p.chords.map((chordName, idx) => (
                              <button 
                                key={idx}
                                onClick={() => handleChordClick(chordName)}
                                className={cn(
                                  "px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95",
                                  chordName.toLowerCase() === selectedChord?.name.toLowerCase() || 
                                  selectedChord?.name.toLowerCase().startsWith(chordName.toLowerCase())
                                    ? "bg-neon-blue text-black shadow-lg shadow-neon-blue/20"
                                    : "bg-white/5 text-white/60 border border-white/5 hover:border-white/20"
                                )}
                              >
                                {chordName}
                              </button>
                            ))}
                          </div>

                          <p className="text-xs text-white/40 leading-relaxed italic">
                            "{p.description}"
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-8 rounded-2xl lg:rounded-3xl shadow-xl">
                  <p className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-bold mb-2">Complexity</p>
                  <p className="text-2xl font-bold text-neon-orange">Medium</p>
                </div>
                <div className="glass-panel p-8 rounded-2xl lg:rounded-3xl shadow-xl">
                  <p className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-bold mb-2">Mood</p>
                  <p className="text-2xl font-bold text-neon-blue">Bright / Open</p>
                </div>
                <div className="glass-panel p-8 rounded-2xl lg:rounded-3xl shadow-xl">
                  <p className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-bold mb-2">Usage</p>
                  <p className="text-2xl font-bold text-white/80">Pop, Rock, Folk</p>
                </div>
                <div className="glass-panel p-8 rounded-2xl lg:rounded-3xl shadow-xl">
                  <p className="text-[11px] text-white/20 uppercase tracking-[0.3em] font-bold mb-2">Families</p>
                  <div className="flex flex-wrap gap-2">
                    {chordFamilies.length > 0 ? (
                      chordFamilies.map((f, i) => (
                        <button 
                          key={i} 
                          onClick={() => {
                            setSelectedFamily(f);
                            setViewMode('families');
                          }}
                          className="px-2 py-1 rounded-md bg-neon-orange/10 text-neon-orange text-xs font-bold hover:bg-neon-orange hover:text-black transition-all"
                        >
                          {f}
                        </button>
                      ))
                    ) : (
                      <span className="text-white/20 text-sm">None</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 glass-panel flex flex-col items-center justify-center text-center p-16 rounded-3xl lg:rounded-[3rem] shadow-2xl">
              <Library className="w-24 h-24 text-white/5 mb-10" />
              <h3 className="text-4xl font-bold mb-6 text-white">Select a Chord</h3>
              <p className="text-white/40 max-w-sm text-xl leading-relaxed">
                Browse the library or search for a specific voicing to see its fretboard diagram.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Chord Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-panel p-8 lg:p-12 rounded-[3rem] border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-3xl font-bold text-white mb-8 tracking-tight">Create Custom Voicing</h3>
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-4">Chord Name</label>
                  <input 
                    type="text"
                    value={newChord.name}
                    onChange={(e) => setNewChord(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Gsus4 / D"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-neon-orange/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-4">Fretboard Data</label>
                    <div className="space-y-4">
                      {[0, 1, 2, 3, 4, 5].map((stringIdx) => (
                        <div key={stringIdx} className="flex items-center gap-4">
                          <span className="w-8 text-[10px] font-bold text-white/20 uppercase tracking-tighter">Str {6 - stringIdx}</span>
                          <input 
                            type="number"
                            placeholder="Fret"
                            value={newChord.frets[stringIdx] ?? ''}
                            onChange={(e) => updateNewChordFret(stringIdx, e.target.value === '' ? null : parseInt(e.target.value))}
                            className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-center text-sm"
                          />
                          <input 
                            type="number"
                            placeholder="Finger"
                            value={newChord.fingers[stringIdx] ?? ''}
                            onChange={(e) => updateNewChordFinger(stringIdx, e.target.value === '' ? null : parseInt(e.target.value))}
                            className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-center text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-4">Base Fret</label>
                      <input 
                        type="number"
                        value={newChord.baseFret}
                        onChange={(e) => setNewChord(prev => ({ ...prev, baseFret: parseInt(e.target.value) || 1 }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-neon-orange/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-4">Description (Optional)</label>
                      <textarea 
                        value={newChord.description}
                        onChange={(e) => setNewChord(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the sound or context..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-neon-orange/50 transition-all h-32 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-white/40 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateChord}
                    disabled={!newChord.name}
                    className="flex-1 py-4 bg-neon-orange text-black rounded-2xl font-bold hover:bg-white transition-all disabled:opacity-50"
                  >
                    Save Custom Voicing
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
