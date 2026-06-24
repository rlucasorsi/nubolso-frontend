'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpgrade } from '@/modules/billing/hooks/use-billing';

interface UpgradeButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function UpgradeButton({ className, children = 'Assinar PRO' }: UpgradeButtonProps) {
  const { upgrade, isLoading } = useUpgrade();

  return (
    <Button onClick={upgrade} disabled={isLoading} className={className}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {children}
    </Button>
  );
}
