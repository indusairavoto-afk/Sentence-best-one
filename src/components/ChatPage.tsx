import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Search, PanelLeft, Send, Paperclip, Settings2,
  Share2, MoreHorizontal, Loader2, Sun, Moon, ChevronDown, Zap,
  Heart, SquarePen, ImageIcon, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AI_MODELS, AIModel, PROVIDER_LOGOS } from '../lib/models';
import { ModelSelector } from './ModelSelector';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: AIModel;
  timestamp: Date;
  imageUrl?: string;
  imageProvider?: string;
  generatingImage?: boolean;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface ChatPageProps {
  initialMessage?: string;
  initialModel?: AIModel;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onNavigate: (tab: string) => void;
  onShowDonate: () => void;
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown rendering
  const formatted = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n/g, '<br/>');
  return (
    <div
      className="prose-sm text-zinc-800 dark:text-zinc-200 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${formatted}</p>` }}
    />
  );
}

function ProviderDot({ model }: { model: AIModel }) {
  const [err, setErr] = React.useState(false);
  if (model.id === 'auto') return <Zap size={14} className="text-purple-400" />;
  const logoUrl = PROVIDER_LOGOS[model.provider];
  if (logoUrl && !err) {
    return (
      <img
        src={logoUrl}
        alt={model.provider}
        width={14}
        height={14}
        referrerPolicy="no-referrer"
        onError={() => setErr(true)}
        style={{ width: 14, height: 14, objectFit: 'contain' }}
      />
    );
  }
  return (
    <div className="w-3.5 h-3.5 rounded-full bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[8px] font-bold">
      {model.providerShort.slice(0, 1)}
    </div>
  );
}

export function ChatPage({ initialMessage, initialModel, theme, toggleTheme, onNavigate, onShowDonate }: ChatPageProps) {
  const defaultModel = initialModel ?? AI_MODELS[0];
  const [selectedModel, setSelectedModel] = useState<AIModel>(defaultModel);
  const [chats, setChats] = useState<Chat[]>(() => [{
    id: 'chat-1',
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
  }]);
  const [activeChatId, setActiveChatId] = useState('chat-1');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);

  // Close options popup when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    }
    if (showOptions) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showOptions]);

  const activeChat = chats.find((c) => c.id === activeChatId)!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  useEffect(() => {
    if (initialMessage && !initialSent.current) {
      initialSent.current = true;
      sendMessage(initialMessage);
    }
  }, []);

  function getActiveMessages(): Message[] {
    return chats.find((c) => c.id === activeChatId)?.messages ?? [];
  }

  function updateChat(chatId: string, updater: (c: Chat) => Chat) {
    setChats((prev) => prev.map((c) => (c.id === chatId ? updater(c) : c)));
  }

  // Detect if the user is asking for image generation and extract the image prompt
  function detectImageIntent(text: string): string | null {
    const lower = text.toLowerCase();
    const imageWords = ['image', 'picture', 'photo', 'illustration', 'drawing', 'painting', 'artwork', 'wallpaper', 'poster', 'logo', 'icon', 'banner', 'portrait', 'render', 'visual', 'graphic', 'img', 'pic'];
    const actionWords = ['generate', 'create', 'make', 'draw', 'design', 'show', 'produce', 'gimme', 'get me', 'want a', 'want an'];
    const hasImageWord = imageWords.some(w => lower.includes(w));
    const hasActionWord = actionWords.some(w => lower.includes(w));

    if (hasImageWord && hasActionWord) {
      // Try to extract subject after "action [a/an] imageNoun [of/about/with] <subject>"
      const m1 = text.match(/(?:generate|create|make|draw|design|produce|show|get)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|illustration|drawing|painting|artwork|wallpaper|poster|logo|icon|banner|portrait|render|visual|graphic|img|pic)\s+(?:of\s+|about\s+|showing\s+|with\s+)?(.+)/i);
      if (m1?.[1]?.trim()) return m1[1].trim();
      // Try "action <subject> image/picture" — preserve the subject
      const m2 = text.match(/(?:generate|create|make|draw|design|produce|show)\s+(.+?)\s+(?:image|picture|photo|illustration|artwork|wallpaper|poster|logo|icon|banner|portrait|render)/i);
      if (m2?.[1]?.trim()) return `${m2[1].trim()} ${text.match(/image|picture|photo|illustration|artwork|wallpaper|poster|logo|icon|banner|portrait|render/i)?.[0] ?? ''}`.trim();
      return text; // fallback: use full text as prompt
    }

    // Catch vague requests: "just generate it", "generate anything", "generate something"
    if (hasActionWord && /\b(?:it|anything|something|one|some)\b/.test(lower)) {
      return 'a beautiful abstract artwork, vibrant colors, high quality';
    }

    return null;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Auto-detect image generation intent and route directly to image generation
    const imagePrompt = detectImageIntent(trimmed);
    if (imagePrompt) {
      return sendImageMessage(imagePrompt);
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    // Add user message and update title if first message
    const currentMessages = getActiveMessages();
    updateChat(activeChatId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : '') : c.title,
      messages: [...c.messages, userMsg],
    }));
    setInput('');
    setIsLoading(true);

    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      timestamp: new Date(),
    };

    updateChat(activeChatId, (c) => ({
      ...c,
      messages: [...c.messages, assistantMsg],
    }));

    const SYSTEM_PROMPT = `You are the AI assistant for Seamless Bridge, an all-in-one AI platform that gives users access to multiple leading AI models in a private, secure workspace. This platform CAN generate images directly — users just need to switch to image mode (the image icon in the toolbar) or ask you to generate one. You help users brainstorm ideas, refine responses, write, code, analyze, and more. Always be helpful, concise, and friendly.`;

    try {
      const history = currentMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: trimmed },
          ],
          model: selectedModel.id,
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === activeChatId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === assistantMsgId ? { ...m, content: fullText } : m
                            ),
                          }
                        : c
                    )
                  );
                }
              } catch {}
            }
          }
        }
      }
    } catch (err: any) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: '⚠️ Sorry, there was an error processing your request. Please check your API key configuration.' }
                    : m
                ),
              }
            : c
        )
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function sendImageMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `🎨 ${trimmed}`,
      timestamp: new Date(),
    };

    updateChat(activeChatId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? `Image: ${trimmed.slice(0, 35)}…` : c.title,
      messages: [...c.messages, userMsg],
    }));
    setInput('');
    setIsLoading(true);

    const assistantMsgId = crypto.randomUUID();
    updateChat(activeChatId, (c) => ({
      ...c,
      messages: [...c.messages, {
        id: assistantMsgId,
        role: 'assistant' as const,
        content: '',
        model: selectedModel,
        timestamp: new Date(),
        generatingImage: true,
      }],
    }));

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Image generation failed');
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, imageUrl: data.url, imageProvider: data.provider, content: '', generatingImage: false }
                    : m
                ),
              }
            : c
        )
      );
    } catch (err: any) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: `⚠️ Image generation failed: ${err.message}`, generatingImage: false }
                    : m
                ),
              }
            : c
        )
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function newChat() {
    const id = `chat-${Date.now()}`;
    setChats((prev) => [
      {
        id,
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setActiveChatId(id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex w-full h-full bg-zinc-50 dark:bg-[#0a0a0a]">

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full border-r border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-950 shrink-0 overflow-hidden"
            >
              {/* Logo */}
              <div className="flex items-center gap-2 px-4 py-5 shrink-0">
                <button onClick={() => onNavigate('home')} className="flex items-center gap-2 group">
                  <div className="w-7 h-7 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center shrink-0">
                    <Zap size={14} className="text-white dark:text-zinc-900" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.12em] uppercase font-mono text-zinc-900 dark:text-zinc-100">
                    Seamless<br/>Bridge
                  </span>
                </button>
              </div>

              {/* New Chat */}
              <div className="px-3 mb-3">
                <button
                  onClick={newChat}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <SquarePen size={14} />
                  New Chat
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  <Search size={14} />
                  Search
                </button>
              </div>

              {/* Chats list */}
              <div className="flex-1 overflow-y-auto px-3">
                <p className="text-[9px] uppercase tracking-widest text-zinc-400 font-semibold px-2 mb-1">Chats</p>
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-colors ${
                      chat.id === activeChatId
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                    }`}
                  >
                    {chat.title}
                  </button>
                ))}
              </div>

              {/* Bottom */}
              <div className="px-3 pb-4 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-1 shrink-0">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-white/5 mb-2">
                  <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">Get More with Pro</p>
                  <p className="text-[9px] text-zinc-500 mb-2">Unlock all models and features.</p>
                  <button className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-widest">
                    <Zap size={10} />
                    Upgrade to Pro
                  </button>
                </div>
                <button
                  onClick={onShowDonate}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <Heart size={12} />
                  Donate
                </button>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main chat area */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-white/5 shrink-0">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <PanelLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Share2 size={15} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <MoreHorizontal size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {activeChat.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center mb-4 shadow-lg">
                    <Zap size={20} className="text-white dark:text-zinc-900" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">How can I help you?</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Start a conversation with any AI model.</p>
                </div>
              )}

              {activeChat.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        {msg.model ? <ProviderDot model={msg.model} /> : <Zap size={12} className="text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {msg.model && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">{msg.model.name}</span>
                          </div>
                        )}
                        {msg.imageUrl ? (
                          <div className="flex flex-col gap-2">
                            <img
                              src={msg.imageUrl}
                              alt="Generated image"
                              className="rounded-xl max-w-full border border-zinc-200 dark:border-white/10"
                              style={{ maxHeight: 480, objectFit: 'contain' }}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400">{msg.imageProvider}</span>
                              <a
                                href={msg.imageUrl}
                                download="generated-image.png"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                              >
                                <Download size={10} /> Save
                              </a>
                            </div>
                          </div>
                        ) : msg.content ? (
                          <MarkdownContent content={msg.content} />
                        ) : msg.generatingImage ? (
                          <div className="flex flex-col gap-3">
                            <div
                              className="relative w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10"
                              style={{ height: 280 }}
                            >
                              {/* Shimmer base */}
                              <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
                              {/* Animated shimmer sweep */}
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                                  backgroundSize: '200% 100%',
                                  animation: 'shimmer 1.4s infinite linear',
                                }}
                              />
                              {/* Pulsing center icon */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center animate-pulse">
                                    <ImageIcon size={22} className="text-violet-400" />
                                  </div>
                                  <div className="absolute -inset-2 rounded-3xl border border-violet-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs font-medium text-zinc-400">Generating image…</span>
                                  <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                      <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-violet-400"
                                        style={{ animation: `bounce 0.9s ${i * 0.15}s infinite` }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <style>{`
                              @keyframes shimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } }
                              @keyframes bounce { 0%,100% { transform: translateY(0); opacity:0.5 } 50% { transform: translateY(-4px); opacity:1 } }
                            `}</style>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 py-2">
                            <Loader2 size={14} className="animate-spin text-zinc-400" />
                            <span className="text-sm text-zinc-400">Thinking…</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="max-w-[75%] px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="px-4 pb-4 shrink-0">
            <div className="relative max-w-2xl mx-auto" ref={optionsRef}>

              {/* Options popup — rendered OUTSIDE overflow-hidden, above the input */}
              {showOptions && (
                <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-64 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl p-2">
                  {/* Deep Analysis */}
                  <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Deep Analysis</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Reasoned, structured output</p>
                    </div>
                    <button
                      onClick={() => setDeepAnalysis((v) => !v)}
                      className={`relative rounded-full shrink-0 mt-0.5 transition-colors ${deepAnalysis ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                      style={{ width: 32, height: 18 }}
                    >
                      <span
                        className={`absolute top-0.5 rounded-full transition-transform ${deepAnalysis ? 'bg-white dark:bg-zinc-900 translate-x-[14px]' : 'bg-white dark:bg-zinc-400 translate-x-0.5'}`}
                        style={{ width: 14, height: 14 }}
                      />
                    </button>
                  </div>
                  {/* Web Search */}
                  <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Web Search</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Fetch real-time information</p>
                    </div>
                    <button
                      onClick={() => setWebSearch((v) => !v)}
                      className={`relative rounded-full shrink-0 mt-0.5 transition-colors ${webSearch ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                      style={{ width: 32, height: 18 }}
                    >
                      <span
                        className={`absolute top-0.5 rounded-full transition-transform ${webSearch ? 'bg-white dark:bg-zinc-900 translate-x-[14px]' : 'bg-white dark:bg-zinc-400 translate-x-0.5'}`}
                        style={{ width: 14, height: 14 }}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={imageMode ? 'Describe an image to generate…' : 'Ask me anything...'}
                  rows={1}
                  className="w-full px-4 pt-4 pb-2 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none resize-none leading-relaxed"
                  style={{ minHeight: 52, maxHeight: 200 }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
                  }}
                />
                <div className="flex items-center gap-2 px-3 pb-3 pt-1">
                  <button className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Paperclip size={14} />
                  </button>
                  <ModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} compact />
                  <button
                    onClick={() => { setImageMode((v) => !v); setShowOptions(false); }}
                    title="Generate Image"
                    className={`w-7 h-7 flex items-center justify-center transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ${imageMode ? 'text-violet-500 bg-violet-500/10' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                  >
                    <ImageIcon size={14} />
                  </button>
                  <button
                    onClick={() => setShowOptions((v) => !v)}
                    className={`w-7 h-7 flex items-center justify-center transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ${showOptions ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                  >
                    <Settings2 size={14} />
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => imageMode ? sendImageMessage(input) : sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0 ${imageMode ? 'bg-violet-600 text-white' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'}`}
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : imageMode ? (
                      <ImageIcon size={14} />
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
