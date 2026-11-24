import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Plus, Sparkles } from 'lucide-react';

interface CreatableCategoryInputProps {
  value: string;
  onChange: (val: string) => void;
  categories: string[];
  placeholder?: string;
  theme?: 'light' | 'dark';
}

export const CreatableCategoryInput: React.FC<CreatableCategoryInputProps> = ({
  value,
  onChange,
  categories,
  placeholder = 'Type or select category (e.g. Stage Decor, Fireworks)...',
  theme = 'light',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = value.trim().toLowerCase();

  // Filter matching categories
  const matches = useMemo(() => {
    if (!trimmedQuery) return categories;
    return categories.filter((c) => c.toLowerCase().includes(trimmedQuery));
  }, [categories, trimmedQuery]);

  // Check if current typed value is an exact match for an existing category
  const hasExactMatch = useMemo(() => {
    if (!trimmedQuery) return false;
    return categories.some((c) => c.toLowerCase() === trimmedQuery);
  }, [categories, trimmedQuery]);

  const isLight = theme === 'light';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-xl transition-all outline-none ${
            isLight
              ? 'border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              : 'border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
            isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl shadow-xl border overflow-hidden max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 ${
            isLight
              ? 'bg-white border-slate-200 divide-y divide-slate-100 text-slate-800'
              : 'bg-slate-900 border-slate-700 divide-y divide-slate-800 text-slate-100'
          }`}
        >
          {/* If user typed something and it doesn't exactly match any existing category, show option to create as new */}
          {value.trim() && !hasExactMatch && (
            <button
              type="button"
              onClick={() => {
                onChange(value.trim());
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                isLight
                  ? 'bg-teal-50/80 hover:bg-teal-100/80 text-teal-900'
                  : 'bg-teal-950/60 hover:bg-teal-900/80 text-teal-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Plus className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="truncate">
                  Create new category: <strong className="underline">&ldquo;{value.trim()}&rdquo;</strong>
                </span>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                isLight ? 'bg-teal-200/70 text-teal-900' : 'bg-teal-800 text-teal-200'
              }`}>
                New
              </span>
            </button>
          )}

          {/* List of matched or all existing categories */}
          {matches.length > 0 ? (
            matches.map((cat) => {
              const isSelected = cat.toLowerCase() === trimmedQuery;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onChange(cat);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'bg-teal-900/40 text-teal-300 font-semibold'
                      : isLight
                      ? 'hover:bg-slate-50 text-slate-700'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                </button>
              );
            })
          ) : (
            !value.trim() && (
              <div className="px-3.5 py-3 text-xs text-center text-slate-400">
                No categories available. Type to create one.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
