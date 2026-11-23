import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  ChefHat,
  DollarSign,
  XCircle,
} from 'lucide-react';
import type { UserRole } from '../auth/LoginScreen';

export interface RoleNotification {
  id: string;
  type: 'kitchen' | 'accounts' | 'approved' | 'rejected';
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionLabel: string;
  targetNavId: string;
}

function getInitialNotificationsForRole(role: UserRole): RoleNotification[] {
  if (role === 'Manager') {
    return [
      {
        id: 'mgr-1',
        type: 'kitchen',
        title: 'Ingredient Requisition',
        description: 'Kitchen sent Ingredient Requisition for Usman Tariq — Barat',
        time: '12m ago',
        read: false,
        actionLabel: 'Review Requisition',
        targetNavId: 'event-control-center',
      },
      {
        id: 'mgr-2',
        type: 'accounts',
        title: 'Fund Request Approved',
        description: 'Accounts approved fund request of Rs. 85,000',
        time: '45m ago',
        read: false,
        actionLabel: 'View Funds',
        targetNavId: 'event-control-center',
      },
    ];
  }

  if (role === 'Kitchen') {
    return [
      {
        id: 'kit-1',
        type: 'approved',
        title: 'Requisition Approved',
        description: 'Manager approved requisition for Usman Tariq — Barat',
        time: '20m ago',
        read: false,
        actionLabel: 'View Details',
        targetNavId: 'event-requisitions',
      },
      {
        id: 'kit-2',
        type: 'rejected',
        title: 'Requisition Revision Requested',
        description: 'Manager requested quantity update for Ayesha Kamran — Walima',
        time: '1h ago',
        read: false,
        actionLabel: 'View Details',
        targetNavId: 'event-requisitions',
      },
    ];
  }

  if (role === 'Accounts') {
    return [
      {
        id: 'acc-1',
        type: 'accounts',
        title: 'Manager Fund Request',
        description: 'Manager requested Funds of Rs. 85,000 for Event A',
        time: '10m ago',
        read: false,
        actionLabel: 'Review & Approve Funds',
        targetNavId: 'event-tracker',
      },
    ];
  }

  return [];
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
  const [notifications, setNotifications] = useState<RoleNotification[]>(() =>
    getInitialNotificationsForRole(role)
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNotifications(getInitialNotificationsForRole(role));
    setIsOpen(false);
  }, [role]);

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

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-lg z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-teal-50 border border-teal-200 text-[11px] font-mono font-semibold text-teal-800">
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
                No new notifications.
              </p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className={`p-4 transition-colors ${
                    item.read ? 'bg-white' : 'bg-teal-50/25'
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
                          <span className="text-[11px] font-mono text-slate-400">
                            {item.time}
                          </span>
                          {!item.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-700" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => handleActionClick(item)}
                          className="inline-flex items-center rounded-md border border-teal-200 bg-teal-50 hover:bg-teal-100/80 px-2.5 py-1 text-xs font-semibold text-teal-800 transition-colors cursor-pointer"
                        >
                          {item.actionLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
