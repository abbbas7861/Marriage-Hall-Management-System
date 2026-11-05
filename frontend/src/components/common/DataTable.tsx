import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  Database,
  Filter,
  FileQuestion,
} from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  searchPlaceholder?: string;
  showSearchBar?: boolean;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  totalCountLabel?: string;
}

export function DataTable<T>({
  columns,
  data = [],
  keyExtractor,
  emptyTitle = 'No records found',
  emptyMessage = 'The active data feed is empty or awaiting synchronization with the master database.',
  emptyAction,
  searchPlaceholder = 'Filter records...',
  showSearchBar = false,
  filterSlot,
  actionSlot,
  totalCountLabel = 'total records',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const isEmpty = !data || data.length === 0;

  return (
    <div className="w-full bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden flex flex-col">
      {/* Optional Top Filter & Search Bar */}
      {(showSearchBar || filterSlot || actionSlot) && (
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {showSearchBar && (
                <div className="relative min-w-[240px] max-w-sm flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              )}
              {filterSlot}
            </div>
            {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-700/50">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.className || ''}`}
                  scope="col"
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right'
                        ? 'justify-end'
                        : col.align === 'center'
                        ? 'justify-center'
                        : 'justify-start'
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/50 text-slate-300 text-xs">
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="py-16 px-4 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 shadow-xs">
                      <FileQuestion className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-semibold text-white font-['Plus_Jakarta_Sans']">
                        {emptyTitle}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                        {emptyMessage}
                      </p>
                    </div>
                    {emptyAction && <div className="mt-2">{emptyAction}</div>}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-mono mt-1">
                      <Database className="w-3 h-3 text-slate-500" />
                      <span>data.length = 0 [Empty Set]</span>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={keyExtractor ? keyExtractor(item, rowIdx) : rowIdx}
                  className="border-b border-slate-700/50 hover:bg-slate-800/50 text-slate-300 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-3.5 px-4 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item, rowIdx)
                        : col.accessorKey
                        ? String(item[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer & Pagination Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-900/60 border-t border-slate-700/50 text-slate-400 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-300">
            Showing <span className="font-mono text-white">{isEmpty ? 0 : 1}</span> -{' '}
            <span className="font-mono text-white">{data.length}</span> of{' '}
            <span className="font-mono text-white">{data.length}</span> {totalCountLabel}
          </span>
          <div className="hidden md:flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Rows:</span>
            <div className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-medium text-slate-300 flex items-center gap-1">
              <span>{rowsPerPage} / page</span>
            </div>
          </div>
        </div>

        {/* Pagination buttons sequence */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={true}
            className="p-1 rounded border border-slate-700 bg-slate-800 text-slate-600 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded bg-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs"
          >
            1
          </button>
          <button
            type="button"
            disabled={true}
            className="p-1 rounded border border-slate-700 bg-slate-800 text-slate-600 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
