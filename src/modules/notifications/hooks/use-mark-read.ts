import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markNotificationReadAction, markAllNotificationsReadAction } from '../actions/mark-read';

export const useMarkNotificationRead = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['mark_notification_read'],
    mutationFn: (id: string) => markNotificationReadAction(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['notifications'] });
      client.invalidateQueries({ queryKey: ['notifications_unread_count'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['mark_all_notifications_read'],
    mutationFn: markAllNotificationsReadAction,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['notifications'] });
      client.invalidateQueries({ queryKey: ['notifications_unread_count'] });
    },
  });
};
