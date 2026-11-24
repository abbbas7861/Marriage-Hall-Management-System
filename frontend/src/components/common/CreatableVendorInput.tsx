import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Plus, Store } from 'lucide-react';

export interface VendorOption {
  id?: string;
  name: string;
  category?: string;
  phone?: string;
}

interface CreatableVendorInputProps {
  value: string;
  onChange: (name: string, vendor?: VendorOption) => void;
  vendors: VendorOption[];
  placeholder?: string;
  theme?: 'light' | 'dark';
}

export const CreatableVendorInput: React.FC<CreatableVendorInputProps> = ({
  value,
  onChange,
  vendors,
  placeholder = 'Type or select vendor name (e.g. Royal Decorators)...',
  theme = 'light',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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

  // Filter matching vendors by name or category
  const matches = useMemo(() => {
    if (!trimmedQuery) return vendors;
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(trimmedQuery) ||
        (v.category && v.category.toLowerCase().includes(trimmedQuery))
    );
  }, [vendors, trimmedQuery]);

  // Check if typed name already exactly matches an existing vendor
  const hasExactMatch = useMemo(() => {
    if (!trimmedQuery) return false;
    return vendors.some((v) => v.name.toLowerCase() === trimmedQuery);
  }, [vendors, trimmedQuery]);

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
          className={`w-full px-3 py-2 pr-9 text-xs sm:text-sm rounded-lg transition-all outline-none ${
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
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
          {/* New custom vendor option if typed and not exact match */}
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
                <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">
                  Add new payee / vendor: <strong className="underline">&ldquo;{value.trim()}&rdquo;</strong>
                </span>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                  isLight ? 'bg-teal-200/70 text-teal-900' : 'bg-teal-800 text-teal-200'
                }`}
              >
                New
              </span>
            </button>
          )}

          {/* List of matching existing vendors */}
          {matches.length > 0 ? (
            matches.map((v, idx) => {
              const isSelected = v.name.toLowerCase() === trimmedQuery;
              return (
                <button
                  key={`${v.id || v.name}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(v.name, v);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? isLight
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'bg-teal-900/40 text-teal-300 font-semibold'
                      : isLight
                      ? 'hover:bg-slate-50 text-slate-700'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-medium truncate">{v.name}</span>
                    {v.category && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {v.category}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                </button>
              );
            })
          ) : (
            !value.trim() && (
              <div className="px-3.5 py-3 text-xs text-center text-slate-400">
                No vendors listed. Type to add a vendor.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
