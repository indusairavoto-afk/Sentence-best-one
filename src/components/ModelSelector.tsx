import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Search, X, Zap, ChevronDown } from 'lucide-react';
import { AI_MODELS, AIModel, TIER_LABELS, TIER_COLORS, PROVIDER_LOGOS } from '../lib/models';

interface ModelSelectorProps {
  selectedModel: AIModel;
  onSelect: (model: AIModel) => void;
  compact?: boolean;
}

type TierFilter = 'all' | 'light' | 'pro' | 'max';

// Real logo per model — falls back to a simple circle if img errors
function ModelLogo({ model, size = 18 }: { model: AIModel; size?: number }) {
  const [err, setErr] = useState(false);
  const logoUrl = PROVIDER_LOGOS[model.provider];

  if (model.id === 'auto') {
    return (
      <div style={{ width: size, height: size }} className="flex items-center justify-center">
        <Zap size={size * 0.8} className="text-purple-400" />
      </div>
    );
  }

  if (logoUrl && !err) {
    return (
      <img
        src={logoUrl}
        alt={model.provider}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setErr(true)}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      />
    );
  }

  // Fallback circle
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className="rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold shrink-0"
    >
      {model.providerShort.slice(0, 1)}
    </div>
  );
}

// Thin metric bar
function MetricBar({ value, accent }: { value: number; accent: string }) {
  return (
    <div className="flex gap-[3px] items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-full transition-colors"
          style={{
            width: 18,
            height: 3,
            backgroundColor: i <= value ? accent : 'rgba(113,113,122,0.25)',
          }}
        />
      ))}
    </div>
  );
}

interface DropdownProps {
  rect: DOMRect;
  openUpward: boolean;
  showDetail: boolean;
  search: string;
  setSearch: (s: string) => void;
  tierFilter: TierFilter;
  setTierFilter: (t: TierFilter) => void;
  filtered: AIModel[];
  selectedModel: AIModel;
  hoveredModel: AIModel | null;
  setHoveredModel: (m: AIModel | null) => void;
  onSelect: (m: AIModel) => void;
  onClose: () => void;
  searchRef: React.RefObject<HTMLInputElement>;
}

function Dropdown({
  rect, openUpward, showDetail,
  search, setSearch, tierFilter, setTierFilter,
  filtered, selectedModel, hoveredModel, setHoveredModel,
  onSelect, onClose, searchRef,
}: DropdownProps) {
  const LIST_W = 290;
  const DETAIL_W = 240;
  const totalW = showDetail ? LIST_W + DETAIL_W : LIST_W;

  let left = rect.left;
  if (left + totalW > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - totalW - 8);
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    left,
    zIndex: 99999,
    width: totalW,
    ...(openUpward
      ? { bottom: window.innerHeight - rect.top + 6 }
      : { top: rect.bottom + 6 }),
  };

  const detailModel = hoveredModel ?? selectedModel;

  return ReactDOM.createPortal(
    <div
      style={style}
      className="flex shadow-2xl rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Model list ── */}
      <div className="flex flex-col" style={{ width: LIST_W }}>
        {/* Search */}
        <div className="p-2 border-b border-zinc-800/60">
          <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-2.5 py-1.5">
            <Search size={11} className="text-zinc-500 shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Models"
              className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={10} className="text-zinc-500 hover:text-zinc-300" />
              </button>
            )}
          </div>
        </div>

        {/* Tier filters */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-800/60">
          {(['all', 'light', 'pro', 'max'] as TierFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide transition-all ${
                tierFilter === t
                  ? 'bg-white text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t === 'all' ? 'All' : TIER_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Model list — thin custom scrollbar via class */}
        <div className="overflow-y-auto model-list-scroll" style={{ maxHeight: 270 }}>
          {filtered.map((model) => (
            <button
              key={model.id}
              onClick={() => { onSelect(model); onClose(); }}
              onMouseEnter={() => setHoveredModel(model)}
              onMouseLeave={() => setHoveredModel(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                selectedModel.id === model.id
                  ? 'bg-zinc-800'
                  : 'hover:bg-zinc-900'
              }`}
            >
              <ModelLogo model={model} size={16} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-zinc-300 truncate">
                    {model.providerShort && (
                      <span className="text-zinc-500">{model.providerShort} / </span>
                    )}
                    {model.name}
                  </span>
                  {model.tier !== 'auto' && (
                    <span className={`text-[8px] font-bold px-1 py-px rounded border leading-none ${TIER_COLORS[model.tier]}`}>
                      {TIER_LABELS[model.tier]}
                    </span>
                  )}
                </div>
              </div>
              {model.multiplier && (
                <span className="text-[10px] text-zinc-600 shrink-0 font-mono">{model.multiplier}</span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-zinc-600">No models found</div>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {showDetail && (
        <div
          className="border-l border-zinc-800/60 flex flex-col bg-zinc-900/60"
          style={{ width: DETAIL_W }}
        >
          {/* Provider + name */}
          <div className="px-4 pt-4 pb-3 border-b border-zinc-800/40">
            <div className="flex items-center gap-2 mb-2">
              <ModelLogo model={detailModel} size={20} />
              <div className="min-w-0">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none mb-0.5">
                  {detailModel.providerShort || 'Seamless'}
                </p>
                <p className="text-sm font-semibold text-zinc-100 leading-tight truncate">
                  {detailModel.name}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">
              {detailModel.description}
            </p>
          </div>

          {/* Tags */}
          {detailModel.tags && detailModel.tags.length > 0 && (
            <div className="px-4 py-3 border-b border-zinc-800/40">
              <div className="flex flex-wrap gap-1">
                {detailModel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Best at */}
          <div className="px-4 py-3 border-b border-zinc-800/40">
            <p className="text-[8px] uppercase tracking-[0.15em] text-zinc-600 font-semibold mb-1.5">Best at</p>
            <div className="flex flex-wrap gap-1">
              {detailModel.bestAt.map((b) => (
                <span
                  key={b}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-medium"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="px-4 py-3 space-y-2.5">
            {[
              { label: 'Speed',   value: detailModel.speed,   accent: '#60a5fa' },
              { label: 'Quality', value: detailModel.quality, accent: '#a78bfa' },
              { label: 'Cost',    value: detailModel.cost,    accent: '#34d399' },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold w-10 shrink-0">{label}</span>
                <MetricBar value={value} accent={accent} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export function ModelSelector({ selectedModel, onSelect, compact = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [hoveredModel, setHoveredModel] = useState<AIModel | null>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const [openUpward, setOpenUpward] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const openDropdown = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setButtonRect(rect);
    setOpenUpward(rect.top > spaceBelow || spaceBelow < 320);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleDown(e: MouseEvent) {
      if (buttonRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [open]);

  const filtered = AI_MODELS.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'all' || m.tier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={`flex items-center gap-1.5 rounded-lg transition-all ${
          compact
            ? 'px-2 py-1 text-xs hover:bg-zinc-800'
            : 'px-3 py-1.5 text-xs bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 border border-zinc-200/50 dark:border-white/5'
        } text-zinc-700 dark:text-zinc-300`}
      >
        <ModelLogo model={selectedModel} size={14} />
        <span className="font-medium">{selectedModel.name}</span>
        <ChevronDown size={11} className="text-zinc-500" />
      </button>

      {open && buttonRect && (
        <Dropdown
          rect={buttonRect}
          openUpward={openUpward}
          showDetail={!compact}
          search={search}
          setSearch={setSearch}
          tierFilter={tierFilter}
          setTierFilter={setTierFilter}
          filtered={filtered}
          selectedModel={selectedModel}
          hoveredModel={hoveredModel}
          setHoveredModel={setHoveredModel}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
          searchRef={searchRef}
        />
      )}
    </div>
  );
}
