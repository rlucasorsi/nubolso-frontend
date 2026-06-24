import { useState } from 'react';
import { billingService } from '../service/billing-service';

export function useUpgrade() {
  const [isLoading, setIsLoading] = useState(false);

  const upgrade = async () => {
    setIsLoading(true);
    try {
      const url = await billingService.createCheckoutSession();
      window.location.href = url;
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
      const url = await billingService.createPortalSession();
      window.location.href = url;
    } finally {
      setIsLoading(false);
    }
  };

  return { manage, isLoading };
}
