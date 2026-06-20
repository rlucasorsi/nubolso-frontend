'use client';

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

interface AddPurchaseDrawerProps {
  open: boolean;
  onClose: () => void;
  cardId: string | null;
}

export function AddPurchaseDrawer({ open, onClose, cardId }: AddPurchaseDrawerProps) {
  const form = usePurchaseForm({ isOpen: open, cardId });

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            New Purchase
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Register an installment purchase and see the impact on upcoming invoices before confirming.
          </p>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-4">
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
            simulation={form.adjustedSimulation}
            isSimulating={form.isSimulating}
          />
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
            onClick={() => form.handleConfirm(onClose)}
            disabled={!form.isValid || form.isConfirming}
          >
            {form.isConfirming ? 'Confirming...' : 'Confirm Purchase'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
