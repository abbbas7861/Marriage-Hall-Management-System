import React from "react";
import { Lock, X } from "lucide-react";
import { NavModuleId, PortalType, AuthUser } from "../../types";
import { PORTAL_CONFIGS, PortalNavItem } from "../../config/portals";

interface SidebarProps {
  activePortal: PortalType;
  activeModule: NavModuleId;
  onSelectModule: (id: NavModuleId) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onSelectPortal?: (portal: PortalType) => void;
  allowedPortals?: PortalType[];
  currentUser?: AuthUser | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePortal,
  activeModule,
  onSelectModule,
  isOpenMobile,
  onCloseMobile,
  onSelectPortal,
  allowedPortals,
  currentUser,
}) => {
  const effectivePortal: PortalType =
    currentUser?.role === "manager" && activePortal === "admin"
      ? "manager"
      : activePortal;

  const currentPortalConfig =
    PORTAL_CONFIGS[effectivePortal] ||
    (currentUser?.role === "manager"
      ? PORTAL_CONFIGS.manager
      : PORTAL_CONFIGS.admin);
  const PortalIcon = currentPortalConfig.icon;
  const portalKeys: PortalType[] = (
    currentUser?.role === "manager"
      ? ["manager", "kitchen", "waiter", "vendors", "finance"]
      : ["admin", "manager", "kitchen", "waiter", "vendors", "finance"]
  ) as PortalType[];

  const renderNavGroup = (items: PortalNavItem[], groupTitle?: string) => (
    <div className="flex flex-col gap-0.5 mb-4">
      {groupTitle && (
        <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {groupTitle}
        </div>
      )}
      {items
        .filter((i) => i.id !== "waiter-tables")
        .map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              type="button"
              data-route={
                item.path ||
                (item.id === "admin-fbr"
                  ? "/admin/fbr"
                  : item.id === "settings"
                    ? "/settings"
                    : undefined)
              }
              onClick={() => {
                onSelectModule(item.id);
                const targetPath =
                  item.path ||
                  (item.id === "admin-fbr"
                    ? "/admin/fbr"
                    : item.id === "settings"
                      ? "/settings"
                      : undefined);
                if (targetPath && window.location.pathname !== targetPath) {
                  window.history.pushState(null, "", targetPath);
                }
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left group select-none cursor-pointer ${
                isActive
                  ? "bg-teal-600 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white font-normal"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
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
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand & Portal Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0 bg-transparent">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0">
                <PortalIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm text-white tracking-tight truncate">
                  {currentPortalConfig.shortName}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">
                  {currentPortalConfig.name}
                </span>
              </div>
            </div>

            {/* Mobile Close X button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Portal Role Switcher */}
          {onSelectPortal && (
            <div className="px-3 pt-3 pb-2 border-b border-slate-800/60 lg:hidden shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5 block">
                Switch Portal Role
              </span>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
                {portalKeys.map((pKey) => {
                  const cfg = PORTAL_CONFIGS[pKey];
                  const Icon = cfg.icon;
                  const isActive = activePortal === pKey;
                  const isAllowed = allowedPortals
                    ? allowedPortals.includes(pKey)
                    : true;

                  return (
                    <button
                      key={pKey}
                      type="button"
                      disabled={!isAllowed}
                      onClick={() => {
                        if (isAllowed) {
                          onSelectPortal(pKey);
                          if (onCloseMobile) onCloseMobile();
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-bold transition-all ${
                        isActive
                          ? "bg-teal-600 text-white shadow-xs"
                          : isAllowed
                            ? "text-slate-400 hover:text-white hover:bg-slate-800"
                            : "opacity-30 cursor-not-allowed text-slate-600"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="truncate w-full text-center">
                        {cfg.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portal Navigation Groups (Dynamically switched) */}
          <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
            {currentPortalConfig.navGroups.map((group, idx) => (
              <React.Fragment key={group.groupTitle || idx}>
                {idx > 0 && (
                  <div className="my-2 border-t border-slate-800/60" />
                )}
                {renderNavGroup(group.items, group.groupTitle)}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Footer Build & Security Badge */}
        <div className="p-3.5 border-t border-slate-800/80 shrink-0 bg-slate-900/40">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>MHMS v3.5 Enterprise</span>
            <Lock className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>
      </aside>
    </>
  );
};
