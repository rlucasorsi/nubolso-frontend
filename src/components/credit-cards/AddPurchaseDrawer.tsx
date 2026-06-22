'use client';

import { useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { usePurchaseForm } from '@/modules/credit-cards/hooks/use-purchase-form';
import { CreditPurchaseFields } from './CreditPurchaseFields';
import { useTranslations } from '@/i18n/useTranslations';
import { cn } from '@/lib/utils';

type DrawerMode = 'purchase' | 'credit';

interface AddPurchaseDrawerProps {
  open: boolean;
  onClose: () => void;
  cardId: string | null;
}

export function AddPurchaseDrawer({ open, onClose, cardId }: AddPurchaseDrawerProps) {
  const t = useTranslations('creditPurchase');
  const [mode, setMode] = useState<DrawerMode>('purchase');

  const isCredit = mode === 'credit';
  const form = usePurchaseForm({ isOpen: open, cardId, isCredit });

  const handleClose = () => {
    setMode('purchase');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent>
        <DrawerHeader onClose={handleClose}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            {isCredit ? t('creditTitle') : t('title')}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {isCredit ? t('creditDescription') : t('description')}
          </p>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('purchase')}
              className={cn(
                'flex-1 flex items-center justify-center py-2 h-12 text-xs font-bold rounded-xl transition-all duration-300 border',
                mode === 'purchase'
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'border-white/5 bg-surface-container text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              {t('modePurchase')}
            </button>
            <button
              type="button"
              onClick={() => setMode('credit')}
              className={cn(
                'flex-1 flex items-center justify-center py-2 h-12 text-xs font-bold rounded-xl transition-all duration-300 border',
                mode === 'credit'
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'border-white/5 bg-surface-container text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              {t('modeCredit')}
            </button>
          </div>

          <CreditPurchaseFields
            description={form.description}
            onDescriptionChange={form.setDescription}
            inputMode={form.inputMode}
            onInputModeChange={form.setInputMode}
            amount={form.amount}
            onAmountChange={form.setAmount}
            amountError={form.errors.amount}
            installmentsCount={form.installmentsCount}
            onInstallmentsCountChange={form.setInstallmentsCount}
            strategy={form.strategy}
            onStrategyChange={form.setStrategy}
            computedTotal={form.computedTotal}
            purchaseDate={form.purchaseDate}
            onPurchaseDateChange={form.setPurchaseDate}
            purchaseDateError={form.errors.purchaseDate}
            apiError={form.apiError}
            simulation={isCredit ? undefined : form.adjustedSimulation}
            isSimulating={isCredit ? false : form.isSimulating}
          />
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={handleClose}
          >
            {t('cancel')}
          </Button>

          <Button
            className="flex-1 h-11 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all"
            onClick={() => form.handleConfirm(handleClose)}
            disabled={!form.isValid || form.isConfirming}
          >
            {form.isConfirming ? t('confirming') : isCredit ? t('confirmCredit') : t('confirmPurchase')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
