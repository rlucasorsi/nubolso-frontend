'use client';

import { useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';
import { useNotifications } from '@/modules/notifications/hooks/use-notifications';
import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/modules/notifications/hooks/use-mark-read';
import type { Notification } from '@/modules/notifications/model/api/notification';
import { format, isToday, isYesterday } from 'date-fns';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

function formatNotificationDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Ontem ' + format(date, 'HH:mm');
  return format(date, 'dd/MM HH:mm');
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string, url?: string) => void;
}) {
  const isUnread = notification.readAt === null;

  return (
    <button
      onClick={() => onRead(notification.id, notification.data?.url)}
      className={cn(
        'w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-white/5 border-b border-white/5 last:border-0',
        isUnread && 'bg-primary/5',
      )}
    >
      {/* Unread dot */}
      <span className="mt-1.5 shrink-0">
        {isUnread ? (
          <span className="block h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
        ) : (
          <span className="block h-2 w-2 rounded-full bg-white/10" />
        )}
      </span>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            isUnread ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground',
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
            {notification.body}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground/40 mt-1">
          {formatNotificationDate(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const t = useTranslations('notifications');
  const { data, isLoading } = useNotifications(1, 30);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const handleRead = useCallback(
    (id: string, url?: string) => {
      markRead(id);
      if (url) {
        onClose();
        window.location.href = url;
      }
    },
    [markRead, onClose],
  );

  const notifications = data?.data ?? [];
  const hasUnread = notifications.some((n) => n.readAt === null);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-sm bg-card border-white/10 p-0 flex flex-col"
      >
        <SheetTitle className="sr-only">{t('title')}</SheetTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="text-base font-bold">{t('title')}</span>
          </div>
          {hasUnread && (
            <button
              onClick={() => markAllRead()}
              disabled={isMarkingAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {isMarkingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              {t('markAllRead')}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-5 gap-3">
              <div className="p-4 rounded-full bg-white/5">
                <BellOff className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-foreground">{t('emptyTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('emptyHint')}</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={handleRead} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
