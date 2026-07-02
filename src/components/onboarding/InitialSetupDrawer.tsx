'use client';

import { useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { AmountInputField, DateInputField } from '@/components/ui/form-field';
import { localDateStr } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { useUpdateMe } from '@/modules/users/hooks/use-update-me';

interface InitialSetupDrawerProps {
  open: boolean;
}

export function InitialSetupDrawer({ open }: InitialSetupDrawerProps) {
  const t = useTranslations('onboarding');
  const updateMeMutation = useUpdateMe();
  const [value, setValue] = useState('');
  const [date, setDate] = useState(() => localDateStr());

  const parsedValue = parseFloat(value.replace(',', '.'));
  const isFormValid = value !== '' && !Number.isNaN(parsedValue) && Boolean(date);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    await updateMeMutation.mutateAsync({
      currentBalance: parsedValue,
      balanceStartDate: date,
    });
  };

  return (
    <Sheet open={open} onOpenChange={() => {}}>
      <DrawerContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DrawerHeader>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            {t('title')}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {t('description')}
          </SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 pb-6 space-y-6">
          <DateInputField
            label={t('referenceDate')}
            required
            value={date}
            onChange={setDate}
          />

          <AmountInputField
            label={t('currentBalance')}
            required
            value={value}
            onChange={setValue}
          />
        </div>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || updateMeMutation.isPending}
            className="w-full h-11 bg-primary text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            {updateMeMutation.isPending ? t('saving') : t('start')}
            {!updateMeMutation.isPending && (
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}

