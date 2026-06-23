import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constant';

// Local cache that isn't backed by React Query but still holds
// data tied to the previous user's account.
const USER_SCOPED_STORAGE_KEYS = ['cashflow_start_day'];

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(async () => {
    await authService.logout();

    queryClient.clear();
    USER_SCOPED_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_PENDING_EMAIL);

    router.push('/login');
  }, [queryClient, router]);
}
