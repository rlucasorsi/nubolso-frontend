'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useManageSubscription } from '@/modules/billing/hooks/use-billing';

interface ManageSubscriptionButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function ManageSubscriptionButton({
  className,
  children = 'Gerenciar assinatura',
}: ManageSubscriptionButtonProps) {
  const { manage, isLoading } = useManageSubscription();

  return (
    <Button variant="outline" onClick={manage} disabled={isLoading} className={className}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {children}
    </Button>
  );
}
