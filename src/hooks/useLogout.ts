import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constant';

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(async () => {
    await authService.logout();

    queryClient.clear();
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_PENDING_EMAIL);

    router.push('/login');
  }, [queryClient, router]);
}
