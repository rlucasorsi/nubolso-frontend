import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { createCheckoutSessionAction } from '../actions/create-checkout-session';
import { createPortalSessionAction } from '../actions/create-portal-session';

export function useUpgrade() {
  const [isLoading, setIsLoading] = useState(false);

  const upgrade = async () => {
    setIsLoading(true);
    try {
      const result = await createCheckoutSessionAction();
      if (!result.success || !result.data) {
        toast.error(result.message ?? 'Erro ao iniciar checkout. Tente novamente.');
        return;
      }
      window.location.href = result.data;
    } catch {
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return { upgrade, isLoading };
}

export function useManageSubscription() {
  const [isLoading, setIsLoading] = useState(false);

  const manage = async () => {
    setIsLoading(true);
    try {
      const result = await createPortalSessionAction();
      if (!result.success || !result.data) {
        toast.error(result.message ?? 'Erro ao abrir portal. Tente novamente.');
        return;
      }
      window.location.href = result.data;
    } catch {
      toast.error('Erro ao abrir portal. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return { manage, isLoading };
}
