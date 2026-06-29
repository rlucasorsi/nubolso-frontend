import { useQuery } from '@tanstack/react-query';
import { getNotificationsAction } from '../actions/get-notifications';

export const useNotifications = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['notifications', page, pageSize],
    queryFn: () => getNotificationsAction(page, pageSize),
    throwOnError: false,
    retry: false,
  });
};
