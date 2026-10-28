import React from 'react';
import { Lock, Sparkles, LucideIcon } from 'lucide-react';
import { NavModuleId, PortalType } from '../../types';
import { PORTAL_CONFIGS, PortalNavItem } from '../../config/portals';

interface SidebarProps {
  activePortal: PortalType;
  activeModule: NavModuleId;
  onSelectModule: (id: NavModuleId) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePortal,
  activeModule,
  onSelectModule,
  isOpenMobile,
  onCloseMobile,
}) => {
  const currentPortalConfig = PORTAL_CONFIGS[activePortal] || PORTAL_CONFIGS.admin;
  const PortalIcon = currentPortalConfig.icon;

  const renderNavGroup = (items: PortalNavItem[], groupTitle?: string) => (
    <div className="flex flex-col gap-1 mb-4">
      {groupTitle && (
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          {groupTitle}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectModule(item.id);
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group select-none cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-md shadow-teal-950/40 ring-1 ring-white/10'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>

            {item.badge && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold tracking-tight uppercase ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-teal-400 border border-teal-500/20'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#0f172a] via-[#111c30] to-[#0c1424] text-slate-200 z-50 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand & Portal Header */}
          <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-800/80 shrink-0 bg-slate-900/40 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-950/50 ring-1 ring-white/20">
              <PortalIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight truncate font-['Plus_Jakarta_Sans']">
                  {currentPortalConfig.shortName}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest truncate">
                {currentPortalConfig.name}
              </span>
            </div>
          </div>

          {/* Portal Navigation Groups (Dynamically switched) */}
          <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
            {currentPortalConfig.navGroups.map((group, idx) => (
              <React.Fragment key={group.groupTitle || idx}>
                {idx > 0 && <div className="my-2 border-t border-slate-800/60" />}
                {renderNavGroup(group.items, group.groupTitle)}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Footer Build & Security Badge */}
        <div className="p-3.5 border-t border-slate-800/80 shrink-0 bg-[#080d17]/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>MHMS v3.5 Enterprise</span>
            </div>
            <Lock className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
      </aside>
    </>
  );
};
