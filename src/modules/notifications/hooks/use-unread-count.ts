import { useQuery } from '@tanstack/react-query';
import { getUnreadCountAction } from '../actions/get-unread-count';

/** Polls every 60 seconds to keep the badge fresh. */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications_unread_count'],
    queryFn: getUnreadCountAction,
    refetchInterval: 60_000,
    // Don't throw on error — badge simply won't show
    throwOnError: false,
  });
};
