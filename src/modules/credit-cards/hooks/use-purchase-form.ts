'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSimulatePurchase } from './use-simulate-purchase';
import { useCreatePurchase } from './use-create-purchase';
import { useCreateCredit } from './use-create-credit';
import { generateInstallments } from '@/shared/utils/installments';
import { purchaseFormSchema } from '@/lib/schemas/credit-cards';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export type PurchaseInputMode = 'total' | 'installment';
export type PurchaseStrategy = 'FIRST' | 'LAST';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface UsePurchaseFormParams {
  isOpen: boolean;
  cardId: string | null | undefined;
  defaultDate?: string;
  /** Set to false to pause the simulation (e.g. when another tab is active). */
  enabled?: boolean;
  /** When true, submits as a credit/refund instead of a purchase. Simulation is skipped. */
  isCredit?: boolean;
}

export function usePurchaseForm({
  isOpen,
  cardId,
  defaultDate,
  enabled = true,
  isCredit = false,
}: UsePurchaseFormParams) {
  const getInitialDate = () => defaultDate ?? getTodayDateString();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(getInitialDate);
  const [inputMode, setInputMode] = useState<PurchaseInputMode>('total');
  const [strategy, setStrategy] = useState<PurchaseStrategy>('FIRST');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<{ amount?: string; purchaseDate?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const simulateMutation = useSimulatePurchase();
  const createMutation = useCreatePurchase();
  const createCreditMutation = useCreateCredit();

  const numericAmount = parseFloat(amount.replace(',', '.'));
  const totalAmount =
    inputMode === 'installment' && !Number.isNaN(numericAmount)
      ? numericAmount * installmentsCount
      : numericAmount;

  const isValid =
    !!cardId &&
    amount !== '' &&
    !Number.isNaN(numericAmount) &&
    numericAmount > 0 &&
    purchaseDate !== '';

  useEffect(() => {
    if (isOpen) return;
    setDescription('');
    setAmount('');
    setInstallmentsCount(1);
    setPurchaseDate(getInitialDate());
    setInputMode('total');
    setStrategy('FIRST');
    setCategoryId(undefined);
    setErrors({});
    setApiError(null);
    simulateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !enabled || !isValid || !cardId || isCredit) return;

    const timeout = setTimeout(() => {
      simulateMutation.mutate({
        cardId,
        description,
        totalAmount,
        installmentsCount,
        purchaseDate,
      });
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    enabled,
    cardId,
    description,
    totalAmount,
    installmentsCount,
    purchaseDate,
    isValid,
    isCredit,
  ]);

  const adjustedSimulation = useMemo(() => {
    const data = simulateMutation.data;
    if (!data || installmentsCount <= 1 || Number.isNaN(totalAmount) || totalAmount <= 0)
      return data;

    const totalInCents = Math.round(totalAmount * 100);
    const generated = generateInstallments({
      totalAmount: totalInCents,
      installments: installmentsCount,
      strategy,
    });

    return {
      ...data,
      installments: data.installments.map((inst, i) => ({
        ...inst,
        amount: (generated[i]?.amount ?? Math.round(inst.amount * 100)) / 100,
      })),
    };
  }, [simulateMutation.data, strategy, totalAmount, installmentsCount]);

  const computedTotal =
    inputMode === 'installment' && !Number.isNaN(numericAmount) && numericAmount > 0
      ? numericAmount * installmentsCount
      : null;

  async function handleConfirm(onSuccess: () => void) {
    const result = purchaseFormSchema.safeParse({
      cardId: cardId ?? '',
      description,
      amount,
      installmentsCount,
      purchaseDate,
    });

    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setErrors({ amount: errs.amount?.[0], purchaseDate: errs.purchaseDate?.[0] });
      return;
    }

    setErrors({});
    setApiError(null);

    try {
      if (isCredit) {
        await createCreditMutation.mutateAsync({
          cardId,
          description,
          totalAmount,
          installmentsCount,
          purchaseDate,
          strategy,
          categoryId,
        });
      } else {
        await createMutation.mutateAsync({
          cardId,
          description,
          totalAmount,
          installmentsCount,
          purchaseDate,
          strategy,
          categoryId,
        });
      }
      onSuccess();
    } catch (err) {
      setApiError(
        extractErrorMessage(
          err,
          isCredit ? 'Não foi possível registrar o crédito' : 'Não foi possível registrar a compra',
        ),
      );
    }
  }

  return {
    description,
    setDescription,
    amount,
    setAmount,
    installmentsCount,
    setInstallmentsCount,
    purchaseDate,
    setPurchaseDate,
    inputMode,
    setInputMode,
    strategy,
    setStrategy,
    categoryId,
    setCategoryId,
    isValid,
    computedTotal,
    adjustedSimulation,
    isSimulating: simulateMutation.isPending,
    isConfirming: createMutation.isPending || createCreditMutation.isPending,
    errors,
    apiError,
    handleConfirm,
  };
}
