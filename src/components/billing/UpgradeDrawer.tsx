'use client';

import { CheckCircle2, Lock } from 'lucide-react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { useTranslations } from '@/i18n/useTranslations';
import { UpgradeButton } from './UpgradeButton';

interface UpgradeDrawerProps {
  open: boolean;
  onClose: () => void;
  /** i18n key from billing namespace that names the blocked feature, e.g. "featureCreditCards" */
  featureKey?: string;
}

const BENEFITS = ['benefit1', 'benefit2', 'benefit3', 'benefit4'] as const;

export function UpgradeDrawer({ open, onClose, featureKey }: UpgradeDrawerProps) {
  const t = useTranslations('billing');

  const title = featureKey ? t(featureKey as any) : t('upgradeTitle');

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <SheetTitle className="text-xl font-bold font-display text-primary">{title}</SheetTitle>
          </div>
          <p className="text-sm text-muted-foreground">{t('upgradeSubtitle')}</p>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {t('benefitsTitle')}
            </p>
            <ul className="space-y-2.5">
              {BENEFITS.map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DrawerFooter>
          <UpgradeButton className="flex-1 h-11 rounded-xl font-bold hover:scale-[1.02] transition-all" />
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
