'use client';

import { useEffect, useState } from 'react';
import { CreditCardForm, CreditCardFormValues } from './CreditCardForm';
import { Button } from '@/components/ui/button';
import { CreditCard } from '@/modules/credit-cards/model/api/credit-card';
import { useCreateCreditCard } from '@/modules/credit-cards/hooks/use-create-credit-card';
import { useUpdateCreditCard } from '@/modules/credit-cards/hooks/use-update-credit-card';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { creditCardFormSchema } from '@/lib/schemas/credit-cards';
import { useTranslations } from '@/i18n/useTranslations';

interface CreditCardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: CreditCard;
}

const DEFAULT_VALUES: CreditCardFormValues = {
  name: '',
  closingDay: 1,
  dueDay: 10,
  paymentDay: 10,
};

export function CreditCardDrawer({ open, onOpenChange, card }: CreditCardDrawerProps) {
  const t = useTranslations('creditCard');
  const tCommon = useTranslations('common');
  const [values, setValues] = useState<CreditCardFormValues>(DEFAULT_VALUES);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateCreditCard();
  const updateMutation = useUpdateCreditCard();

  useEffect(() => {
    if (!open) return;

    setValues(
      card
        ? {
            name: card.name,
            closingDay: card.closingDay,
            dueDay: card.dueDay,
            paymentDay: card.paymentDay,
          }
        : DEFAULT_VALUES,
    );
    setError(null);
  }, [open, card]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  async function handleSave() {
    const result = creditCardFormSchema.safeParse(values);
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? tCommon('invalidData'));
      return;
    }

    setError(null);

    const payload = {
      name: values.name,
      closingDay: values.closingDay,
      dueDay: values.dueDay,
      paymentDay: values.paymentDay,
    };

    try {
      if (card) {
        await updateMutation.mutateAsync({ id: card.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      setError(extractErrorMessage(err, t('saveError')));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader onClose={() => onOpenChange(false)}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            {card ? t('editCard') : t('newCard')}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {t('configDescription')}
          </p>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4">
          <CreditCardForm values={values} onChange={setValues} error={error || undefined} />
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('cancel')}
          </Button>

          <Button
            className="flex-1 h-11 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t('saving') : t('save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}

