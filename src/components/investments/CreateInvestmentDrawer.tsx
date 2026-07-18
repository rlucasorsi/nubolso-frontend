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
import { TextInputField, AmountInputField, NumberInputField } from '@/components/ui/form-field';
import { InstitutionCombobox } from './InstitutionCombobox';
import { getInvestmentQuoteAction } from '@/modules/investments/actions/get-investment-quote';
import { useInvestmentTickerSearch } from '@/modules/investments/hooks/use-investment-ticker-search';
import type { InvestmentType } from '@/modules/investments/model/api/investment';
import {
  ArrowRight,
  Landmark,
  Building2,
  TrendingUp,
  Wallet,
  LineChart,
  Loader2,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';
import { formatCurrency } from './investment-helpers';

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
    currentBalance?: number;
    shareInfo?: { quantity: number; pricePerShare: number };
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
  const [category, setCategory] = useState<CategoryKey>('FIXED');
  const [type, setType] = useState<InvestmentType>('CDB');
  const [institution, setInstitution] = useState('');
  const [ticker, setTicker] = useState('');
  const [tickerQuery, setTickerQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cdiPercentage, setCdiPercentage] = useState(100);
  const [quantity, setQuantity] = useState(0);
  const [pricePerShare, setPricePerShare] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [quoteChecking, setQuoteChecking] = useState(false);
  const [quoteResult, setQuoteResult] = useState<{ available: boolean; price: number | null } | null>(
    null,
  );

  const needsTicker = type === 'FII' || type === 'STOCK';
  const isCDB = type === 'CDB';

  // Debounce da busca de tickers enquanto o usuário digita.
  useEffect(() => {
    const handle = setTimeout(() => setTickerQuery(ticker), 300);
    return () => clearTimeout(handle);
  }, [ticker]);

  const tickerSearch = useInvestmentTickerSearch(needsTicker ? tickerQuery : '');
  const suggestions = tickerSearch.data ?? [];
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setName('');
    setCategory('FIXED');
    setType('CDB');
    setInstitution('');
    setTicker('');
    setTickerQuery('');
    setShowSuggestions(false);
    setCdiPercentage(100);
    setQuantity(0);
    setPricePerShare('');
    setCurrentBalance('');
    setFormError(null);
    setQuoteResult(null);
  };

  const handleCheckQuote = async (tickerOverride?: string) => {
    const value = (tickerOverride ?? ticker).trim();
    if (!value) return;
    setQuoteChecking(true);
    setQuoteResult(null);
    try {
      const result = await getInvestmentQuoteAction(value);
      setQuoteResult({ available: result.available, price: result.price });
    } catch {
      setQuoteResult({ available: false, price: null });
    } finally {
      setQuoteChecking(false);
    }
  };

  const numericPricePerShare = parseFloat(pricePerShare.replace(',', '.'));
  const sharesTotal =
    needsTicker && quantity > 0 && !isNaN(numericPricePerShare) && numericPricePerShare > 0
      ? quantity * numericPricePerShare
      : 0;

  const handleSubmit = async () => {
    const result = createInvestmentSchema.safeParse({
      name,
      type,
      institution,
      ticker: needsTicker ? ticker : undefined,
      quantity: needsTicker ? quantity : undefined,
      pricePerShare: needsTicker ? pricePerShare : undefined,
      currentBalance: !needsTicker ? currentBalance || undefined : undefined,
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
      currentBalance: needsTicker
        ? sharesTotal
        : currentBalance
          ? parseFloat(currentBalance.replace(',', '.'))
          : undefined,
      shareInfo: needsTicker ? { quantity, pricePerShare: numericPricePerShare } : undefined,
    });
    resetForm();
  };

  const isFormValid =
    name.trim() &&
    institution.trim() &&
    (!needsTicker || (ticker.trim() && quantity > 0 && numericPricePerShare > 0));

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
          <TextInputField
            label={t('name')}
            required
            value={name}
            onChange={setName}
            placeholder={t('namePlaceholder')}
          />

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
                      setQuoteResult(null);
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
                        setQuoteResult(null);
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
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <TextInputField
                    label={t('ticker')}
                    required
                    value={ticker}
                    onChange={(v) => {
                      setTicker(v.toUpperCase());
                      setQuoteResult(null);
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
                              handleCheckQuote(s.symbol);
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
                <Button
                  type="button"
                  variant="outline"
                  disabled={!ticker.trim() || quoteChecking}
                  onClick={() => handleCheckQuote()}
                  className="h-11 rounded-xl border-white/10 hover:bg-white/5 shrink-0"
                >
                  {quoteChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {quoteResult && (
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'text-xs',
                      quoteResult.available ? 'text-success' : 'text-muted-foreground',
                    )}
                  >
                    {quoteResult.available && quoteResult.price !== null
                      ? t('quoteFound', { amount: formatCurrency(quoteResult.price) })
                      : t('quoteNotFound')}
                  </p>
                  {quoteResult.available && quoteResult.price !== null && (
                    <button
                      type="button"
                      onClick={() =>
                        setPricePerShare(quoteResult.price!.toFixed(2).replace('.', ','))
                      }
                      className="text-xs font-bold text-primary hover:underline shrink-0"
                    >
                      {t('useQuote')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {needsTicker && (
            <>
              <NumberInputField
                label={t('quantity')}
                value={quantity}
                onChange={setQuantity}
                min={0}
                max={1000000}
                step={1}
              />
              <AmountInputField
                label={t('pricePerShare')}
                required
                value={pricePerShare}
                onChange={setPricePerShare}
              />
              {sharesTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('totalPreview', { amount: formatCurrency(sharesTotal) })}
                </p>
              )}
            </>
          )}

          {!needsTicker && (
            <AmountInputField
              label={t('initialBalance')}
              value={currentBalance}
              onChange={setCurrentBalance}
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
