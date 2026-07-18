'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { updateInvestmentSchema } from '@/lib/schemas/investments';
import { Button } from '@/components/ui/button';
import { TextInputField, NumberInputField } from '@/components/ui/form-field';
import { InstitutionCombobox } from './InstitutionCombobox';
import type { Investment } from '@/modules/investments/model/api/investment';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';

interface EditInvestmentDrawerProps {
  open: boolean;
  investment: Investment | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    institution: string;
    ticker?: string;
    cdiPercentage?: number;
  }) => Promise<void>;
  isLoading: boolean;
  institutionOptions: string[];
}

export function EditInvestmentDrawer({
  open,
  investment,
  onClose,
  onSubmit,
  isLoading,
  institutionOptions,
}: EditInvestmentDrawerProps) {
  const t = useTranslations('editInvestmentDrawer');
  const tc = useTranslations('createInvestmentDrawer');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [ticker, setTicker] = useState('');
  const [cdiPercentage, setCdiPercentage] = useState(100);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (investment) {
      setName(investment.name);
      setInstitution(investment.institution ?? '');
      setTicker(investment.ticker ?? '');
      setCdiPercentage(investment.cdiPercentage ?? 100);
      setFormError(null);
    }
  }, [investment]);

  if (!investment) return null;

  const isCDB = investment.type === 'CDB';
  const needsTicker = investment.type === 'FII' || investment.type === 'STOCK';

  const handleSubmit = async () => {
    const result = updateInvestmentSchema.safeParse({
      name,
      institution,
      ticker: needsTicker ? ticker : undefined,
      cdiPercentage: isCDB ? cdiPercentage : undefined,
    });
    if (!result.success) {
      setFormError(result.error.errors[0]?.message ?? tCommon('invalidData'));
      return;
    }

    setFormError(null);
    await onSubmit({
      name: name.trim(),
      institution: institution.trim(),
      ticker: needsTicker ? ticker.trim().toUpperCase() : undefined,
      cdiPercentage: isCDB ? cdiPercentage : undefined,
    });
  };

  const isFormValid = name.trim() && institution.trim() && (!needsTicker || ticker.trim());

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            {t('title')}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {t('subtitle')}
          </SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 pb-6 space-y-6">
          <TextInputField
            label={tc('name')}
            required
            value={name}
            onChange={setName}
            placeholder={tc('namePlaceholder')}
          />

          <InstitutionCombobox
            label={tc('institution')}
            required
            value={institution}
            onChange={setInstitution}
            options={institutionOptions}
            placeholder={tc('institutionPlaceholder')}
          />

          {isCDB && (
            <NumberInputField
              label={tc('cdiPercentage')}
              value={cdiPercentage}
              onChange={setCdiPercentage}
              min={0}
              max={300}
              step={0.01}
              suffix="%"
            />
          )}

          {needsTicker && (
            <TextInputField
              label={tc('ticker')}
              required
              value={ticker}
              onChange={(v) => setTicker(v.toUpperCase())}
              placeholder={tc('tickerPlaceholder')}
              autoComplete="off"
            />
          )}
        </div>

        <DrawerFooter>
          {formError && <p className="text-xs text-destructive text-center pb-1">{formError}</p>}
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className="w-full h-11 bg-primary text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            {isLoading ? tCommon('saving') : tCommon('save')}
            {!isLoading && (
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
