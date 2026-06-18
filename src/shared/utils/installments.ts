type Strategy = "FIRST" | "LAST";

export interface Installment {
  installment: number;
  amount: number; // in cents
}

interface GenerateInstallmentsParams {
  totalAmount: number; // in cents
  installments: number;
  strategy?: Strategy;
}

export function generateInstallments({
  totalAmount,
  installments,
  strategy = "FIRST",
}: GenerateInstallmentsParams): Installment[] {
  const base = Math.floor(totalAmount / installments);
  const remainder = totalAmount - base * installments;

  return Array.from({ length: installments }, (_, i) => {
    const number = i + 1;
    const isAdjusted =
      strategy === "FIRST" ? number === 1 : number === installments;

    return {
      installment: number,
      amount: isAdjusted ? base + remainder : base,
    };
  });
}

export function validateInstallments(
  installments: Installment[],
  totalAmount: number
): boolean {
  const sum = installments.reduce((acc, { amount }) => acc + amount, 0);
  return sum === totalAmount;
}

export function recalculateAfterEdit(
  installments: Installment[],
  editedIndex: number,
  newAmount: number,
  totalAmount: number,
  strategy: Strategy = "FIRST"
): Installment[] {
  const updated = installments.map((inst, i) =>
    i === editedIndex ? { ...inst, amount: newAmount } : inst
  );

  const currentSum = updated.reduce((acc, { amount }) => acc + amount, 0);
  const diff = totalAmount - currentSum;

  if (diff === 0) return updated;

  // Find the installment to absorb the difference, skipping the edited one
  const adjustTarget =
    strategy === "FIRST"
      ? updated.findIndex((_, i) => i !== editedIndex)
      : [...updated].map((_, i) => i).reverse().find((i) => i !== editedIndex) ?? -1;

  if (adjustTarget === -1) return updated;

  return updated.map((inst, i) =>
    i === adjustTarget ? { ...inst, amount: inst.amount + diff } : inst
  );
}
