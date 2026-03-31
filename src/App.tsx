import React, { useState, useEffect } from 'react';
import { 
  Music, 
  MessageSquare, 
  Library, 
  Settings, 
  Activity, 
  Clock, 
  ChevronRight, 
  LogOut, 
  User as UserIcon,
  Menu,
  Sparkles,
  Search,
  Play,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from './lib/utils';
import Assistant from './components/assistant/Assistant';
import Intel from './components/intel/Intel';
import Workbench from './components/workbench/Workbench';
import Dashboard from './components/dashboard/Dashboard';
import Analyst from './components/analyst/Analyst';

import { MetronomeProvider } from './contexts/MetronomeContext';

import { useMetronome } from './contexts/MetronomeContext';

type View = 'assistant' | 'intel' | 'workbench' | 'dashboard' | 'analyst';

export default function App() {
  return (
    <MetronomeProvider>
      <AppContent />
    </MetronomeProvider>
  );
}

function AppContent() {
  const { isPlaying, togglePlay, bpm, beat, subdivision } = useMetronome();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('assistant');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Sync user profile
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              theoryLevel: 'Beginner',
              practiceTime: 0,
              createdAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("Error syncing user:", e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-void-black">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Music className="w-12 h-12 text-neon-orange" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-void-black px-4 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-orange/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/10 blur-[120px] rounded-full" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md z-10"
        >
          <div className="mb-8 flex justify-center">
            <div className="p-4 rounded-full bg-neon-orange/10 border border-neon-orange/20">
              <Music className="w-16 h-16 text-neon-orange" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tighter text-white">LUTHIER AI</h1>
          <p className="text-white/40 mb-10 text-lg">
            The ultimate AI-powered guitar assistant. Master theory, analyze tracks, and refine your technique in the Neon Void.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neon-orange hover:text-white transition-all duration-300 flex items-center justify-center gap-3 group shadow-xl shadow-white/5"
          >
            Get Started
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-void-black overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-neon-orange/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-neon-blue/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-void-black border-r border-white/5 z-[70] lg:hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neon-orange flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display font-bold text-xl tracking-tighter text-white">LUTHIER</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/40">
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                <NavItem 
                  icon={MessageSquare} 
                  label="Assistant" 
                  active={currentView === 'assistant'} 
                  onClick={() => { setCurrentView('assistant'); setIsMobileMenuOpen(false); }} 
                  collapsed={false}
                />
                <NavItem 
                  icon={Library} 
                  label="Intel" 
                  active={currentView === 'intel'} 
                  onClick={() => { setCurrentView('intel'); setIsMobileMenuOpen(false); }} 
                  collapsed={false}
                />
                <NavItem 
                  icon={Search} 
                  label="Analyst" 
                  active={currentView === 'analyst'} 
                  onClick={() => { setCurrentView('analyst'); setIsMobileMenuOpen(false); }} 
                  collapsed={false}
                />
                <NavItem 
                  icon={Activity} 
                  label="Workbench" 
                  active={currentView === 'workbench'} 
                  onClick={() => { setCurrentView('workbench'); setIsMobileMenuOpen(false); }} 
                  collapsed={false}
                />
                <NavItem 
                  icon={Clock} 
                  label="Dashboard" 
                  active={currentView === 'dashboard'} 
                  onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} 
                  collapsed={false}
                />
              </nav>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-neon-blue" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{user.displayName}</p>
                    <p className="text-xs text-white/40 truncate">Pro Member</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 80 }}
        className="hidden lg:flex h-full border-r border-white/5 bg-void-gray/20 backdrop-blur-md flex-col z-50"
      >
        <div className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-neon-orange flex items-center justify-center shrink-0">
            <Music className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <span className="font-display font-bold text-xl tracking-tighter">LUTHIER</span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-8">
          <NavItem 
            icon={MessageSquare} 
            label="Assistant" 
            active={currentView === 'assistant'} 
            onClick={() => setCurrentView('assistant')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={Library} 
            label="Intel" 
            active={currentView === 'intel'} 
            onClick={() => setCurrentView('intel')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={Search} 
            label="Analyst" 
            active={currentView === 'analyst'} 
            onClick={() => setCurrentView('analyst')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={Activity} 
            label="Workbench" 
            active={currentView === 'workbench'} 
            onClick={() => setCurrentView('workbench')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={Clock} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
            collapsed={!isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-colors",
            isSidebarOpen ? "bg-white/5" : "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-neon-blue" />
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-white/40 truncate">Pro Member</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        <header className="shrink-0 z-40 px-4 py-3 lg:px-10 lg:py-4 flex items-center justify-between bg-void-black/95 backdrop-blur-3xl border-b border-white/10 shadow-2xl">
          <div className="flex items-center gap-4 lg:gap-6">
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(true);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-95 border border-white/5"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            
            {/* Metronome Mini */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <button 
                onClick={togglePlay}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg",
                  isPlaying ? "bg-red-500 text-white shadow-red-500/20" : "bg-neon-orange text-white shadow-neon-orange/20"
                )}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>
              <div className="flex flex-col items-center min-w-[32px]">
                <span className="text-sm font-black text-white tabular-nums leading-none">{bpm}</span>
                <span className="text-[8px] text-white/30 uppercase font-bold tracking-tighter">BPM</span>
              </div>
              <div className="flex gap-0.5">
                {(subdivision === '8' ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3]).map((i) => (
                  <div 
                    key={i}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      subdivision === '8' ? "w-0.5 h-0.5" : "w-1 h-1",
                      isPlaying && beat === (i + 1) % (subdivision === '8' ? 8 : 4)
                        ? (i === (subdivision === '8' ? 7 : 3) ? "bg-neon-orange shadow-[0_0_8px_#FF6321]" : "bg-neon-blue shadow-[0_0_8px_#00F0FF]")
                        : "bg-white/10"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <h2 className="text-lg lg:text-xl font-bold capitalize tracking-tight text-white leading-tight">{currentView}</h2>
              <p className="hidden lg:block text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Luthier Intelligence Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-neon-orange/5 border border-neon-orange/20">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-orange animate-pulse shadow-[0_0_8px_#FF6321]" />
              <span className="text-[10px] font-bold text-neon-orange uppercase tracking-widest">Live Engine</span>
            </div>
            <div className="lg:hidden w-8 h-8 rounded-full bg-neon-blue/10 border border-white/10 flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-neon-blue" />
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full min-h-full flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                {currentView === 'assistant' && <Assistant />}
                {currentView === 'intel' && <Intel />}
                {currentView === 'analyst' && <Analyst user={user} />}
                {currentView === 'workbench' && <Workbench />}
                {currentView === 'dashboard' && <Dashboard />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, collapsed }: { 
  icon: React.ElementType, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  collapsed: boolean
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group relative",
        active ? "bg-neon-orange text-white shadow-lg shadow-neon-orange/20" : "text-white/40 hover:text-white hover:bg-white/5",
        collapsed && "justify-center"
      )}
    >
      <div className={cn("shrink-0", active ? "text-white" : "group-hover:text-neon-orange transition-colors")}>
        <Icon size={20} />
      </div>
      {!collapsed && <span className="text-sm font-semibold tracking-tight">{label}</span>}
      {active && collapsed && (
        <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
      )}
    </button>
  );
}

function PlaceholderView({ title, icon }: { title: string, icon: React.ReactNode }) {
  return (
    <div className="glass-panel p-12 flex flex-col items-center justify-center text-center min-h-[60vh]">
      <div className="mb-6 p-6 rounded-full bg-white/5 text-white/20">
        {icon}
      </div>
      <h3 className="text-3xl font-bold mb-2">{title}</h3>
      <p className="text-white/40 max-w-sm">
        This module is currently being calibrated by the Luthier AI engine. 
        Full functionality will be available in the next phase.
      </p>
    </div>
  );
}
