import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  ChefHat,
  DollarSign,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import type { UserRole } from '../auth/LoginScreen';
import { portalNotificationsApi, PortalNotificationItem } from '../../api/client';

export interface RoleNotification {
  id: string;
  type: 'kitchen' | 'accounts' | 'approved' | 'rejected';
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionLabel: string;
  targetNavId: string;
  status?: string;
  senderRole?: string;
  senderName?: string;
}

function timeAgo(dateString?: string): string {
  if (!dateString) return 'Just now';
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

function mapApiNotification(item: PortalNotificationItem): RoleNotification {
  let mappedType: RoleNotification['type'] = 'kitchen';
  if (item.status === 'Accepted' || item.title.toLowerCase().includes('approved') || item.title.toLowerCase().includes('accepted')) {
    mappedType = 'approved';
  } else if (item.status === 'Rejected' || item.title.toLowerCase().includes('declined') || item.title.toLowerCase().includes('rejected')) {
    mappedType = 'rejected';
  } else if (item.senderRole?.toLowerCase() === 'manager' || item.targetRole?.toLowerCase() === 'accounts' || item.title.toLowerCase().includes('fund')) {
    mappedType = 'accounts';
  } else {
    mappedType = 'kitchen';
  }

  return {
    id: String(item.id),
    type: mappedType,
    title: item.title,
    description: item.description,
    time: timeAgo(item.createdAt),
    read: Boolean(item.isRead),
    actionLabel: item.actionLabel || 'View Details',
    targetNavId: item.targetNavId || 'overview',
    status: item.status || 'Pending',
    senderRole: item.senderRole,
    senderName: item.senderName,
  };
}

interface NotificationCenterProps {
  role: UserRole;
  onNavigate?: (navId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  role,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<RoleNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const items = await portalNotificationsApi.list(role);
      if (items && items.length > 0) {
        setNotifications(items.map(mapApiNotification));
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.warn('Failed to fetch portal notifications:', err);
    }
  }, [role]);

  // Initial fetch and auto-polling every 8 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await portalNotificationsApi.markAllRead(role);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleActionClick = (item: RoleNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (onNavigate) {
      onNavigate(item.targetNavId);
    }
    setIsOpen(false);
  };

  const handleRespond = async (
    e: React.MouseEvent,
    id: string,
    action: 'accept' | 'reject'
  ) => {
    e.stopPropagation();
    try {
      setRespondingId(id);
      await portalNotificationsApi.respond(id, action, `${role} Portal`);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                status: action === 'accept' ? 'Accepted' : 'Rejected',
                type: action === 'accept' ? 'approved' : 'rejected',
                read: true,
              }
            : n
        )
      );
      // Refresh to ensure any reverse notifications or backend updates reflect
      setTimeout(fetchNotifications, 500);
    } catch (err) {
      console.error(`Failed to ${action} notification request:`, err);
    } finally {
      setRespondingId(null);
    }
  };

  const renderIcon = (type: RoleNotification['type']) => {
    switch (type) {
      case 'kitchen':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <ChefHat className="w-4 h-4 text-amber-700" />
          </div>
        );
      case 'accounts':
        return (
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-teal-700" />
          </div>
        );
      case 'approved':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        );
      case 'rejected':
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
        aria-expanded={isOpen}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread notifications`}
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-rose-50 border border-rose-200 text-[11px] font-mono font-semibold text-rose-700">
                  {unreadCount}
                </span>
              )}
            </div>

            {notifications.length > 0 && unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List or Empty State */}
          {notifications.length === 0 ? (
            <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <BellOff className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                You&apos;re all caught up!
              </p>
              <p className="text-xs text-slate-500 mt-1">
                No active notifications for {role} portal.
              </p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notifications.map((item) => {
                const isPending = item.status === 'Pending';
                const isAccepted = item.status === 'Accepted';
                const isRejected = item.status === 'Rejected';
                const isProcessing = respondingId === item.id;

                return (
                  <li
                    key={item.id}
                    className={`p-4 transition-colors ${
                      item.read ? 'bg-white' : 'bg-teal-50/30'
                    } hover:bg-slate-50/80`}
                  >
                    <div className="flex items-start gap-3">
                      {renderIcon(item.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.time}
                            </span>
                            {!item.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Status badge if already acted upon */}
                        {isAccepted && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Accepted / Approved
                          </div>
                        )}
                        {isRejected && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Declined
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-2.5 flex items-center gap-2">
                          {/* If pending request directed to this role, provide quick Accept / Decline */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={(e) => handleRespond(e, item.id, 'accept')}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={(e) => handleRespond(e, item.id, 'reject')}
                                className="inline-flex items-center gap-1 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {/* Navigation target link */}
                          <button
                            type="button"
                            onClick={() => handleActionClick(item)}
                            className="inline-flex items-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                          >
                            {item.actionLabel}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
