import { useGetMe } from '@/modules/users/hooks/use-get-me';
import { FREE_LIMITS } from '../constants/plan-limits.constant';

export function usePlan() {
  const { data: me, isLoading } = useGetMe();
  const plan = me?.plan ?? 'FREE';
  const isPro = plan === 'PRO';
  const isFree = plan === 'FREE';

  return {
    plan,
    isPro,
    isFree,
    limits: FREE_LIMITS,
    isLoading,
  };
}
