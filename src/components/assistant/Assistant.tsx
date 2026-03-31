import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Music, BookOpen, Guitar, Trash2, Loader2, Zap, Brain, MessageSquare, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { sendMessageStreamToLuthier } from '../../services/geminiService';
import { Message } from '../../types';
import { cn } from '../../lib/utils';

const FEATURES = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Music Theory Expert",
    description: "Deep knowledge of scales, modes, and harmonic structures."
  },
  {
    icon: <Music className="w-6 h-6" />,
    title: "Chord Intelligence",
    description: "Generate complex progressions and discover new voicings."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Feedback",
    description: "Real-time answers to your most technical musical questions."
  }
];

const EXAMPLE_PROMPTS = [
  { icon: <Music className="w-4 h-4" />, text: "Suggest a melancholic jazz progression in D minor." },
  { icon: <Guitar className="w-4 h-4" />, text: "Explain the Lydian Dominant scale for guitarists." },
  { icon: <BookOpen className="w-4 h-4" />, text: "How do I play a Cmaj13 voicing?" },
  { icon: <Sparkles className="w-4 h-4" />, text: "Give me a bluesy turnaround in A." }
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const modelMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: '',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, modelMessage]);

    try {
      const stream = sendMessageStreamToLuthier(messages, text.trim());
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last.id === modelMessage.id) {
            return [...prev.slice(0, -1), { ...last, text: fullText }];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Assistant Error:", error);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, text: "The Luthier engine is currently out of tune. Please try again later." }];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const startChat = () => {
    inputRef.current?.focus();
  };

  const tryDemo = () => {
    handleSend("Show me what you can do with a quick demo of your music theory knowledge.");
  };

  return (
    <div className="flex flex-col h-full max-w-[1400px] mx-auto">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 space-y-8 pb-8 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-h-full flex flex-col items-center justify-center text-center py-12 lg:py-20"
            >
              {/* Hero Section */}
              <div className="max-w-4xl mx-auto mb-20">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-orange/10 border border-neon-orange/20 text-neon-orange text-xs font-bold uppercase tracking-widest mb-8"
                >
                  <Zap className="w-4 h-4" />
                  Next-Gen Music Intelligence
                </motion.div>
                
                <h1 className="text-6xl lg:text-8xl font-bold mb-8 tracking-tighter text-white neon-text-glow leading-[0.9]">
                  Luthier <span className="text-neon-orange">Assistant</span>
                </h1>
                
                <p className="text-white/40 max-w-2xl mx-auto text-lg lg:text-2xl leading-relaxed mb-12">
                  The ultimate AI companion for guitarists and composers. 
                  Master theory, unlock progressions, and elevate your sound.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button 
                    onClick={startChat}
                    className="px-8 py-4 bg-neon-orange text-white rounded-2xl font-bold text-lg hover:bg-white hover:text-black transition-all shadow-lg shadow-neon-orange/20 active:scale-95 flex items-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Start Chat
                  </button>
                  <button 
                    onClick={tryDemo}
                    className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Try Demo
                  </button>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-24 px-4">
                {FEATURES.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="p-8 glass-panel text-left border-white/5 hover:border-white/20 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-neon-orange transition-colors mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Example Prompts */}
              <div className="w-full max-w-4xl px-4">
                <h4 className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold mb-8 text-center">Example Prompts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EXAMPLE_PROMPTS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(suggestion.text)}
                      className="p-6 glass-panel text-left hover:border-neon-orange/30 transition-all group flex items-center gap-4 active:scale-[0.98]"
                    >
                      <div className="p-3 rounded-xl bg-white/5 text-white/20 group-hover:text-neon-orange transition-colors shrink-0">
                        {suggestion.icon}
                      </div>
                      <span className="text-sm font-medium text-white/40 group-hover:text-white transition-colors">
                        {suggestion.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 py-8">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] lg:max-w-[70%] p-6 lg:p-8 rounded-3xl shadow-2xl",
                    msg.role === 'user' 
                      ? "bg-neon-orange text-white rounded-tr-none shadow-neon-orange/10" 
                      : "glass-panel rounded-tl-none border-white/10 backdrop-blur-3xl"
                  )}>
                    <div className={cn(
                      "prose prose-invert prose-sm lg:prose-lg max-w-none font-sans leading-relaxed",
                      msg.role === 'user' ? "text-white" : "text-white/90"
                    )}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/20 mt-3 px-4 uppercase tracking-widest font-bold">
                    {msg.role === 'user' ? 'You' : 'Luthier Intelligence'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 lg:px-8 pb-8">
        <div className="glass-panel p-3 lg:p-4 flex items-center gap-4 border-white/10 focus-within:border-neon-orange/40 transition-all rounded-[2rem] shadow-2xl backdrop-blur-3xl relative z-10">
          <button 
            onClick={clearChat}
            className="p-4 text-white/10 hover:text-red-400 transition-colors hidden sm:block"
            title="Clear Chat"
          >
            <Trash2 className="w-6 h-6" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Luthier about music theory..."
            className="flex-1 bg-transparent border-none outline-none text-base lg:text-xl py-3 px-4 text-white placeholder:text-white/10"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={cn(
              "p-4 lg:p-5 rounded-2xl transition-all active:scale-95 shadow-xl",
              input.trim() && !isTyping 
                ? "bg-neon-orange text-white shadow-neon-orange/20 hover:scale-105" 
                : "bg-white/5 text-white/10 cursor-not-allowed"
            )}
          >
            {isTyping ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
