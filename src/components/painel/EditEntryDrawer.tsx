'use client';

import { useEffect, useState } from 'react';
import { EntryForm, EntryFormValues, resolveTipoDespesa } from './EntryForm';
import { entryFormSchema } from '@/lib/schemas/transactions';
import { Button } from '@/components/ui/button';
import { useUpdateEntry } from '@/modules/entries/hooks/use-update-entry';
import { CashFlowEntry, FlowType } from '@/lib/cashflow';
import { useTranslations } from '@/i18n/useTranslations';
import { toast } from 'sonner';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';

interface EditEntryDrawerProps {
  entry: CashFlowEntry | null;
  open: boolean;
  onClose: () => void;
  minDate?: string;
}

export function EditEntryDrawer({ entry, open, onClose, minDate }: EditEntryDrawerProps) {
  const t = useTranslations('entries');
  const { mutate: updateEntry, isPending } = useUpdateEntry();

  const [values, setValues] = useState<EntryFormValues>({
    date: '',
    amount: '',
    type: 'income',
    description: '',
  });
  const [errors, setErrors] = useState<{
    date?: string;
    amount?: string;
    tipoDespesa?: string;
  }>({});

  useEffect(() => {
    if (entry) {
      setValues({
        date: entry.date,
        amount: Number(entry.amount).toFixed(2).replace('.', ','),
        type: entry.type as FlowType,
        description: entry.description ?? '',
        categoryId: entry.categoryId ?? undefined,
        tipoDespesa: entry.tipoDespesa ?? null,
      });
      setErrors({});
    }
  }, [entry]);

  function handleSave() {
    const result = entryFormSchema.safeParse(values);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setErrors({
        date: errs.date?.[0],
        amount: errs.amount?.[0],
        tipoDespesa: errs.tipoDespesa?.[0],
      });
      toast.error(
        errs.date?.[0] ??
          errs.amount?.[0] ??
          errs.tipoDespesa?.[0] ??
          errs.type?.[0] ??
          t('saveError'),
      );
      return;
    }
    setErrors({});
    updateEntry(
      {
        id: entry!.id,
        description: values.description,
        amount: parseFloat(values.amount.replace(',', '.')),
        type: values.type,
        date: values.date,
        categoryId: values.categoryId,
        tipoDespesa: resolveTipoDespesa(values),
      },
      {
        onSuccess: onClose,
        onError: () => toast.error(t('saveError')),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            {t('editEntry')}
          </SheetTitle>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4">
          <EntryForm values={values} onChange={setValues} errors={errors} minDate={minDate} />
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={onClose}
            disabled={isPending}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            className="flex-1 h-11 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? t('saving') : t('save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
