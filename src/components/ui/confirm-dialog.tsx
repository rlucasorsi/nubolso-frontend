import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ConfirmVariant = 'destructive' | 'warning';

const variantStyles: Record<ConfirmVariant, { icon: string; action: string }> = {
  destructive: {
    icon: 'bg-red-500/10 text-red-500',
    action:
      'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white hover:border-red-600',
  },
  warning: {
    icon: 'bg-amber-500/10 text-amber-500',
    action:
      'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:text-white hover:border-amber-600',
  },
};

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: React.ReactNode;
  variant?: ConfirmVariant;
  title: React.ReactNode;
  description: React.ReactNode;
  cancelLabel: string;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  icon,
  variant = 'destructive',
  title,
  description,
  cancelLabel,
  actionLabel,
  onAction,
  actionDisabled,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {icon && (
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-1',
                styles.icon,
              )}
            >
              {icon}
            </div>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onAction} disabled={actionDisabled} className={styles.action}>
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
