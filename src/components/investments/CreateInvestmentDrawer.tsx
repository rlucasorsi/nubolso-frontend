'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { createInvestmentSchema } from '@/lib/schemas/investments';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TextInputField, NumberInputField } from '@/components/ui/form-field';
import { InstitutionCombobox } from './InstitutionCombobox';
import { useInvestmentTickerSearch } from '@/modules/investments/hooks/use-investment-ticker-search';
import type { InvestmentType } from '@/modules/investments/model/api/investment';
import { isVariableIncome } from './investment-helpers';
import {
  ArrowRight,
  Landmark,
  Building2,
  TrendingUp,
  PieChart,
  Wallet,
  LineChart,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';

type CategoryKey = 'FIXED' | 'VARIABLE' | 'OTHER';

const CATEGORIES: {
  key: CategoryKey;
  labelKey: 'fixedIncome' | 'variableIncome' | 'otherCategory';
  Icon: React.ComponentType<{ className?: string }>;
  options: { type: InvestmentType; Icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  { key: 'FIXED', labelKey: 'fixedIncome', Icon: Landmark, options: [{ type: 'CDB', Icon: Landmark }] },
  {
    key: 'VARIABLE',
    labelKey: 'variableIncome',
    Icon: LineChart,
    options: [
      { type: 'FII', Icon: Building2 },
      { type: 'STOCK', Icon: TrendingUp },
      { type: 'ETF', Icon: PieChart },
    ],
  },
  { key: 'OTHER', labelKey: 'otherCategory', Icon: Wallet, options: [{ type: 'OTHER', Icon: Wallet }] },
];

interface CreateInvestmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: InvestmentType;
    ticker?: string;
    cdiPercentage?: number;
    institution: string;
  }) => Promise<void>;
  isLoading: boolean;
  institutionOptions: string[];
}

export function CreateInvestmentDrawer({
  open,
  onClose,
  onSubmit,
  isLoading,
  institutionOptions,
}: CreateInvestmentDrawerProps) {
  const t = useTranslations('createInvestmentDrawer');
  const tt = useTranslations('investmentTypes');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  // Enquanto o nome não é editado à mão, ele acompanha o ticker — cobre o
  // caso comum de renda variável, onde o nome do ativo já é o próprio
  // ticker (ex: "MXRF11"). Editar o campo desliga esse acompanhamento.
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);
  const [category, setCategory] = useState<CategoryKey>('FIXED');
  const [type, setType] = useState<InvestmentType>('CDB');
  const [institution, setInstitution] = useState('');
  const [ticker, setTicker] = useState('');
  const [tickerQuery, setTickerQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cdiPercentage, setCdiPercentage] = useState(100);
  const [formError, setFormError] = useState<string | null>(null);

  const needsTicker = isVariableIncome(type);
  const isCDB = type === 'CDB';

  // Debounce da busca de tickers enquanto o usuário digita.
  useEffect(() => {
    const handle = setTimeout(() => setTickerQuery(ticker), 300);
    return () => clearTimeout(handle);
  }, [ticker]);

  useEffect(() => {
    if (needsTicker && !nameManuallyEdited) setName(ticker);
  }, [ticker, needsTicker, nameManuallyEdited]);

  const tickerSearch = useInvestmentTickerSearch(needsTicker ? tickerQuery : '');
  const suggestions = tickerSearch.data ?? [];
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setName('');
    setNameManuallyEdited(false);
    setCategory('FIXED');
    setType('CDB');
    setInstitution('');
    setTicker('');
    setTickerQuery('');
    setShowSuggestions(false);
    setCdiPercentage(100);
    setFormError(null);
  };

  const handleSubmit = async () => {
    const result = createInvestmentSchema.safeParse({
      name,
      type,
      institution,
      ticker: needsTicker ? ticker : undefined,
    });
    if (!result.success) {
      setFormError(result.error.errors[0]?.message ?? tCommon('invalidData'));
      return;
    }

    setFormError(null);
    await onSubmit({
      name,
      type,
      ticker: needsTicker ? ticker.trim().toUpperCase() : undefined,
      cdiPercentage: isCDB ? cdiPercentage : undefined,
      institution: institution.trim(),
    });
    resetForm();
  };

  const isFormValid = name.trim() && institution.trim() && (!needsTicker || ticker.trim());

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetForm();
          onClose();
        }
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
          <div className="space-y-1">
            <TextInputField
              label={t('name')}
              required
              value={name}
              onChange={(v) => {
                setName(v);
                setNameManuallyEdited(true);
              }}
              placeholder={t('namePlaceholder')}
            />
            {needsTicker && !nameManuallyEdited && ticker.trim() && (
              <p className="text-xs text-muted-foreground pl-1">{t('nameFollowsTickerHint')}</p>
            )}
          </div>

          <InstitutionCombobox
            label={t('institution')}
            required
            value={institution}
            onChange={setInstitution}
            options={institutionOptions}
            placeholder={t('institutionPlaceholder')}
          />

          <div className="space-y-4">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('type')}
            </Label>

            <div className="flex gap-2">
              {CATEGORIES.map(({ key, labelKey, Icon }) => {
                const isActive = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (category === key) return;
                      setCategory(key);
                      const firstOption = CATEGORIES.find((c) => c.key === key)!.options[0].type;
                      setType(firstOption);
                      setShowSuggestions(false);
                    }}
                    className={cn(
                      'flex-1 flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl transition-all active:scale-95',
                      isActive
                        ? 'bg-primary text-white ring-1 ring-white/10'
                        : 'glass-card text-muted-foreground hover:bg-white/5 border-border/20',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold">{t(labelKey)}</span>
                  </button>
                );
              })}
            </div>

            {(CATEGORIES.find((c) => c.key === category)?.options.length ?? 0) > 1 && (
              <div className="flex gap-2">
                {CATEGORIES.find((c) => c.key === category)!.options.map(({ type: opt, Icon }) => {
                  const isActive = type === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setType(opt);
                        setShowSuggestions(false);
                      }}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all active:scale-95 border',
                        isActive
                          ? 'bg-primary/10 text-primary border-primary/40'
                          : 'bg-transparent text-muted-foreground hover:bg-white/5 border-border/20',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-bold">{tt(opt)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isCDB && (
            <NumberInputField
              label={t('cdiPercentage')}
              value={cdiPercentage}
              onChange={setCdiPercentage}
              min={0}
              max={300}
              step={0.01}
              suffix="%"
            />
          )}

          {needsTicker && (
            <div className="relative">
              <TextInputField
                label={t('ticker')}
                required
                value={ticker}
                onChange={(v) => {
                  setTicker(v.toUpperCase());
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={t('tickerPlaceholder')}
                autoComplete="off"
              />
              {showSuggestions && ticker.trim().length >= 2 && (
                <div
                  ref={suggestionsBoxRef}
                  className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover rounded-xl overflow-hidden border border-white/10 shadow-2xl max-h-52 overflow-y-auto"
                >
                  {tickerSearch.isFetching ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    </div>
                  ) : suggestions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      {t('noSuggestions')}
                    </p>
                  ) : (
                    suggestions.map((s) => (
                      <button
                        key={s.symbol}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setTicker(s.symbol);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="text-sm font-bold text-foreground">{s.symbol}</span>
                        <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t('noInitialValueHint')}</p>
        </div>

        <DrawerFooter>
          {formError && <p className="text-xs text-destructive text-center pb-1">{formError}</p>}
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className="w-full h-11 bg-primary text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            {isLoading ? t('creating') : t('createBtn')}
            {!isLoading && (
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
