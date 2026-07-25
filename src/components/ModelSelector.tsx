import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Zap, ChevronDown } from 'lucide-react';
import { AI_MODELS, AIModel, TIER_LABELS, TIER_COLORS } from '../lib/models';

interface ModelSelectorProps {
  selectedModel: AIModel;
  onSelect: (model: AIModel) => void;
  compact?: boolean;
}

type TierFilter = 'all' | 'light' | 'pro' | 'max';

function SpeedBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-5 rounded-full ${i <= value ? color : 'bg-zinc-700'}`}
        />
      ))}
    </div>
  );
}

function ProviderIcon({ model }: { model: AIModel }) {
  if (model.id === 'auto') {
    return (
      <div className="w-5 h-5 flex items-center justify-center">
        <Zap size={14} className="text-purple-400" />
      </div>
    );
  }
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
      style={{ backgroundColor: model.iconColor + '30', border: `1px solid ${model.iconColor}50` }}
    >
      <span style={{ color: model.iconColor }}>{model.providerShort.slice(0, 1)}</span>
    </div>
  );
}

export function ModelSelector({ selectedModel, onSelect, compact = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [hoveredModel, setHoveredModel] = useState<AIModel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = AI_MODELS.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'all' || m.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const detailModel = hoveredModel || selectedModel;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg transition-all ${
          compact
            ? 'px-2 py-1 text-xs hover:bg-zinc-800'
            : 'px-3 py-1.5 text-xs bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 border border-zinc-200/50 dark:border-white/5'
        } text-zinc-700 dark:text-zinc-300`}
      >
        <Zap size={11} className="text-purple-400 shrink-0" />
        <span className="font-medium">{selectedModel.name}</span>
        <ChevronDown size={11} className="text-zinc-500" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 flex gap-0 shadow-2xl rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900" style={{ width: 320 }}>
          {/* Left: model list */}
          <div className="flex flex-col w-full">
            {/* Search */}
            <div className="p-2 border-b border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1.5">
                <Search size={12} className="text-zinc-400 shrink-0" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Models"
                  className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none"
                />
                {search && (
                  <button onClick={() => setSearch('')}>
                    <X size={11} className="text-zinc-400 hover:text-zinc-200" />
                  </button>
                )}
              </div>
            </div>

            {/* Tier filters */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-zinc-100 dark:border-white/5">
              {(['all', 'light', 'pro', 'max'] as TierFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide transition-all ${
                    tierFilter === t
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {t === 'all' ? 'All' : TIER_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Model list */}
            <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
              {filtered.map((model) => (
                <button
                  key={model.id}
                  onClick={() => { onSelect(model); setOpen(false); }}
                  onMouseEnter={() => setHoveredModel(model)}
                  onMouseLeave={() => setHoveredModel(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    selectedModel.id === model.id
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <ProviderIcon model={model} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {model.providerShort && (
                          <span className="text-zinc-500 dark:text-zinc-400">{model.providerShort} / </span>
                        )}
                        {model.name}
                      </span>
                      {model.tier !== 'auto' && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TIER_COLORS[model.tier]}`}>
                          {TIER_LABELS[model.tier]}
                        </span>
                      )}
                    </div>
                  </div>
                  {model.multiplier && (
                    <span className="text-[10px] text-zinc-400 shrink-0">{model.multiplier}</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-zinc-400">No models found</div>
              )}
            </div>
          </div>

          {/* Right: detail panel */}
          <div className="w-72 border-l border-zinc-100 dark:border-white/5 p-4 flex flex-col gap-3 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ProviderIcon model={detailModel} />
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {detailModel.providerShort && `${detailModel.providerShort} / `}{detailModel.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {detailModel.description}
              </p>
            </div>

            {detailModel.tags && (
              <div className="flex flex-wrap gap-1">
                {detailModel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300/50 dark:border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-2 font-semibold">Best at</p>
              <div className="flex flex-wrap gap-1">
                {detailModel.bestAt.map((b) => (
                  <span
                    key={b}
                    className="text-[9px] px-2 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[9px] text-zinc-400 mb-1">
                  <span>Speed</span>
                </div>
                <SpeedBar value={detailModel.speed} color="bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-zinc-400 mb-1">
                  <span>Quality</span>
                </div>
                <SpeedBar value={detailModel.quality} color="bg-purple-500" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-zinc-400 mb-1">
                  <span>Cost</span>
                </div>
                <SpeedBar value={detailModel.cost} color="bg-green-500" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
