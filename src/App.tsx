import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Heart, Zap, Paperclip, Settings2, Send, Image as ImageIcon, FileText, Code2, Lightbulb, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { DonationSection } from './components/DonationSection';
import { DonationModal } from './components/DonationModal';
import { About } from './components/About';
import { Impact } from './components/Impact';
import { FAQ } from './components/FAQ';
import { Privacy } from './components/Privacy';
import { Terms } from './components/Terms';
import { Contact } from './components/Contact';
import { Security } from './components/Security';
import { AILogoMarquee } from './components/AILogoMarquee';
import { ChatPage } from './components/ChatPage';
import { ModelSelector } from './components/ModelSelector';
import { AI_MODELS, AIModel } from './lib/models';

export const STAT_BASES = { visitors: 15420, uses: 8940 };
export const MANUAL_DONATIONS = 0;

export interface ChatData {
  title: string;
  messages: { role: string; content: string; content_html?: string; images?: string[]; timestamp?: string }[];
}

type Tab = 'home' | 'chat' | 'about' | 'impact' | 'faq' | 'privacy' | 'terms' | 'contact' | 'security';

const QUICK_ACTIONS = [
  { icon: <ImageIcon size={12} />, label: 'Describe Image' },
  { icon: <FileText size={12} />, label: 'Summarize PDF' },
  { icon: <Code2 size={12} />, label: 'Explain Code' },
  { icon: <Lightbulb size={12} />, label: 'Brainstorm Ideas' },
];

const URL_PLACEHOLDERS = [
  'Ask me anything…',
  'Compare these two approaches…',
  'Write a Python script that…',
  'Explain quantum computing in simple terms…',
  'Help me brainstorm ideas for…',
  'Summarize this article…',
];

function useTypewriter(phrases: string[], speed = 50, deleteSpeed = 30, pause = 2000) {
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const phrase = phrases[idx];
    if (!deleting && text === phrase) {
      t = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text === '') {
      setDeleting(false);
      setIdx((i) => (i + 1) % phrases.length);
    } else {
      const next = deleting ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1);
      t = setTimeout(() => setText(next), deleting ? deleteSpeed : speed);
    }
    return () => clearTimeout(t);
  }, [text, deleting, idx, phrases, speed, deleteSpeed, pause]);

  return text;
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('theme');
      if (s === 'dark' || s === 'light') return s;
    }
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme((t) => {
      const n = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', n);
      return n;
    });
  };

  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [landingInput, setLandingInput] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [pendingModel, setPendingModel] = useState<AIModel>(AI_MODELS[0]);
  const placeholder = useTypewriter(URL_PLACEHOLDERS);
  const landingTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  function startChat(message?: string, model?: AIModel) {
    setPendingMessage(message ?? '');
    setPendingModel(model ?? selectedModel);
    setCurrentTab('chat');
  }

  function handleLandingSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!landingInput.trim()) return;
    startChat(landingInput, selectedModel);
  }

  function handleQuickAction(label: string) {
    startChat(`Help me with: ${label}`, selectedModel);
  }

  // Full-screen chat page (no outer nav)
  if (currentTab === 'chat') {
    return (
      <>
        <Toaster theme={theme} richColors />
        <ChatPage
          initialMessage={pendingMessage}
          initialModel={pendingModel}
          theme={theme}
          toggleTheme={toggleTheme}
          onNavigate={(tab) => setCurrentTab(tab as Tab)}
          onShowDonate={() => setShowDonationModal(true)}
        />
        <DonationModal isOpen={showDonationModal} onClose={() => setShowDonationModal(false)} />
      </>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''} bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100`}>
      <Toaster theme={theme} richColors />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5 border-b border-zinc-200/50 dark:border-white/5 backdrop-blur-xl bg-white/70 dark:bg-black/50 shrink-0 shadow-sm">
        <button onClick={() => setCurrentTab('home')} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center shrink-0">
            <Zap size={16} className="text-white dark:text-zinc-900" />
          </div>
          <span className="text-sm font-bold tracking-[0.10em] uppercase font-mono bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 leading-tight hidden sm:block">
            SEAMLESS<br />BRIDGE
          </span>
        </button>

        <nav className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="hidden md:flex items-center gap-1 mr-3">
            <button onClick={() => setCurrentTab('about')} className={`px-3 py-1.5 rounded-lg transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 ${currentTab === 'about' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : ''}`}>About</button>
            <button onClick={() => setCurrentTab('impact')} className={`px-3 py-1.5 rounded-lg transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 ${currentTab === 'impact' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : ''}`}>Impact</button>
            <button onClick={() => setCurrentTab('faq')} className={`px-3 py-1.5 rounded-lg transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 ${currentTab === 'faq' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : ''}`}>FAQ</button>
          </div>

          <button
            onClick={() => setShowDonationModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all mr-1"
          >
            <Heart size={12} className="text-red-400" />
            Donate
          </button>

          <button
            onClick={() => startChat()}
            className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-all"
          >
            Start Chat
          </button>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 ml-1 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all flex items-center justify-center shrink-0"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </nav>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {currentTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center px-4 pt-16 pb-12"
            >
              {/* Hero */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-center max-w-3xl leading-[1.08] mb-5">
                All-in-One AI Platform<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-400 dark:from-white dark:via-zinc-300 dark:to-zinc-600">
                  with All Leading AI Models
                </span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 text-center max-w-xl leading-relaxed mb-10">
                Access GPT, Claude, Gemini, DeepSeek, Grok, and more — all in a private, secure workspace.
                Brainstorm ideas, refine responses, and switch models instantly.
              </p>

              {/* AI Marquee */}
              <AILogoMarquee />

              {/* Chat input box */}
              <form
                onSubmit={handleLandingSubmit}
                className="w-full max-w-2xl mt-8 group/container"
              >
                <div className="relative border border-zinc-200/50 dark:border-transparent p-[1.5px] bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden isolate">
                  {/* Animated border */}
                  <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
                    <div className="absolute inset-[-150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#00000000_50%,#18181b_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#00000000_50%,#ffffff_100%)] opacity-30 group-hover/container:opacity-100 transition-opacity duration-700" />
                  </div>
                  <div className="absolute inset-[1.5px] bg-white dark:bg-[#0a0a0a] rounded-2xl z-10 pointer-events-none" />

                  <div className="relative z-20 flex flex-col bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-white/5 shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_-15px_rgba(255,255,255,0.05)]">
                    <textarea
                      ref={landingTextareaRef}
                      value={landingInput}
                      onChange={(e) => setLandingInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleLandingSubmit();
                        }
                      }}
                      placeholder={placeholder}
                      rows={2}
                      className="w-full px-5 pt-5 pb-3 bg-transparent text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none resize-none leading-relaxed"
                      style={{ minHeight: 72 }}
                    />
                    <div className="flex items-center gap-2 px-4 pb-4 pt-1">
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Paperclip size={15} />
                      </button>
                      <ModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} />
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Settings2 size={15} />
                      </button>
                      <div className="flex-1" />
                      <button
                        type="submit"
                        disabled={!landingInput.trim()}
                        className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick action pills */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {QUICK_ACTIONS.map(({ icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleQuickAction(label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </form>

              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mt-20">
                {[
                  {
                    icon: <Zap size={18} />,
                    title: 'All Leading Models',
                    desc: 'GPT-4o, Claude 3.7, Gemini 2.5, Grok 3, DeepSeek, and more — one unified interface.',
                  },
                  {
                    icon: <Settings2 size={18} />,
                    title: 'Smart Auto-Select',
                    desc: 'Let the platform route your query to the best model automatically based on task type.',
                  },
                  {
                    icon: <Heart size={18} />,
                    title: 'Open & Free',
                    desc: 'Built transparently for the community. No hidden fees, no lock-in. Donate if it helps you.',
                  },
                ].map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className="p-5 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-white/10 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-3">
                      {icon}
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5">{title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <DonationSection />
            </motion.div>
          )}

          {currentTab === 'about' && (
            <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <About />
            </motion.div>
          )}
          {currentTab === 'impact' && (
            <motion.div key="impact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Impact />
            </motion.div>
          )}
          {currentTab === 'faq' && (
            <motion.div key="faq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FAQ />
            </motion.div>
          )}
          {currentTab === 'privacy' && (
            <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Privacy />
            </motion.div>
          )}
          {currentTab === 'terms' && (
            <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Terms />
            </motion.div>
          )}
          {currentTab === 'contact' && (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Contact />
            </motion.div>
          )}
          {currentTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Security />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      {(currentTab as string) !== 'chat' && (
        <footer className="border-t border-zinc-200/50 dark:border-white/5 py-6 px-4 sm:px-12">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
            <span>© 2025 Seamless Bridge — All-in-One AI Platform</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentTab('privacy')} className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">Privacy</button>
              <button onClick={() => setCurrentTab('terms')} className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">Terms</button>
              <button onClick={() => setCurrentTab('contact')} className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">Contact</button>
              <button onClick={() => setCurrentTab('security')} className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">Security</button>
            </div>
          </div>
        </footer>
      )}

      <DonationModal isOpen={showDonationModal} onClose={() => setShowDonationModal(false)} />
    </div>
  );
}
