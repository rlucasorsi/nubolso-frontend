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
    action: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
  },
  warning: {
    icon: 'bg-amber-500/10 text-amber-500',
    action: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
  },
};

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
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
      <AlertDialogContent className="bg-[#1c1a24] border-white/10 rounded-[2rem] p-8 max-w-[400px]">
        <AlertDialogHeader className="space-y-4">
          <div
            className={cn(
              'w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-2',
              styles.icon,
            )}
          >
            {icon}
          </div>
          <AlertDialogTitle className="text-xl font-black font-display text-white text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-center text-sm font-medium">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
          <AlertDialogCancel className="flex-1 h-12 rounded-2xl bg-white/5 border-none text-white hover:bg-white/10 transition-all font-bold">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAction}
            disabled={actionDisabled}
            className={cn(
              'flex-1 h-12 rounded-2xl text-white transition-all font-bold shadow-lg',
              styles.action,
            )}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
