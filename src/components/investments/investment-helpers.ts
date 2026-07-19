import type { Investment, InvestmentType } from '@/modules/investments/model/api/investment';
import { getMovementSharePosition } from '@/lib/investmentShareLedger';

// FII/Ação/ETF têm cotação, comportam-se como renda variável (posição,
// preço médio, valor de mercado). CDB/Outro são renda fixa (saldo
// controlado manualmente ou por movimentações em dinheiro). Recebe o tipo
// direto (não o Investment inteiro) pra também servir os formulários de
// criação/edição, que só têm o tipo selecionado, ainda sem um Investment.
export function isVariableIncome(type: InvestmentType): boolean {
  return type === 'FII' || type === 'STOCK' || type === 'ETF';
}

// Total investido (principal): soma dos aportes/retiradas (CONTRIBUTION),
// sem contar proventos nem ajustes de mercado.
export function getTotalContributed(investment: Investment): number {
  return investment.movements
    .filter((m) => m.type === 'CONTRIBUTION')
    .reduce((sum, m) => sum + m.amount, 0);
}

// Rendimento total: proventos recebidos + ajustes de valorização/desvalorização.
// YIELD nunca altera currentBalance, mas conta como "quanto rendeu".
export function getTotalYield(investment: Investment): number {
  return investment.movements
    .filter((m) => m.type === 'YIELD' || m.type === 'ADJUSTMENT')
    .reduce((sum, m) => sum + m.amount, 0);
}

// Rentabilidade %: rendimento sobre o total investido. Sem base de custo
// (nada investido ainda, ou tudo retirado), a % não faz sentido — retorna null.
export function getYieldPercentage(investment: Investment): number | null {
  const totalContributed = getTotalContributed(investment);
  if (totalContributed <= 0) return null;
  return (getTotalYield(investment) / totalContributed) * 100;
}

export interface SharePosition {
  // Quantidade de cotas/ações atualmente em carteira, pelo que este
  // navegador conseguiu rastrear. null = não sabemos (nenhum dado local),
  // não confundir com "0 cotas" (posição zerada, mas conhecida).
  quantity: number | null;
  // Preço médio pago nas compras rastreadas. Ajustes (reafirmação do valor
  // de mercado) não entram na conta — só refletem preço de hoje, não custo
  // de aquisição.
  avgPrice: number | null;
  // true quando existe movimentação/saldo que este navegador não consegue
  // explicar (histórico de antes desse recurso, ou de outro dispositivo) —
  // os números acima ficam incompletos ou ausentes nesse caso.
  hasPartialData: boolean;
}

export function getSharePosition(investment: Investment): SharePosition {
  let heldQuantity = 0;
  let buyQuantity = 0;
  let buyCost = 0;
  let hasPartialData = false;
  let hasAnyTrackedData = false;

  const chronological = [...investment.movements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  for (const movement of chronological) {
    if (movement.type === 'CONTRIBUTION') {
      // Prefere dados vindos da API; cai no localStorage como fallback para
      // movimentos criados antes deste campo existir no backend.
      const apiQty = movement.shareQuantity;
      const apiPrice = movement.pricePerShare;
      const localEntry =
        apiQty == null || apiPrice == null
          ? getMovementSharePosition(investment.id, movement.id)
          : undefined;

      const quantity = apiQty ?? localEntry?.quantity;
      const price = apiPrice ?? localEntry?.pricePerShare;

      if (quantity == null || price == null) {
        hasPartialData = true;
        continue;
      }
      hasAnyTrackedData = true;
      if (movement.amount >= 0) {
        heldQuantity += quantity;
        buyQuantity += quantity;
        buyCost += quantity * price;
      } else {
        heldQuantity -= quantity;
      }
    } else if (movement.type === 'ADJUSTMENT') {
      const apiQty = movement.shareQuantity;
      const localEntry =
        apiQty == null ? getMovementSharePosition(investment.id, movement.id) : undefined;
      const quantity = apiQty ?? localEntry?.quantity;
      // Ajuste sem quantidade rastreada não invalida o que já sabemos.
      if (quantity != null) {
        hasAnyTrackedData = true;
        heldQuantity = quantity;
      }
    }
  }

  // Sem nenhum dado rastreado neste navegador mas com sinais de que existe
  // uma posição real (saldo ou histórico de movimentações) — não dá pra
  // assumir "0 cotas", é "não sabemos".
  if (!hasAnyTrackedData) {
    const hasRealPosition = investment.currentBalance > 0 || investment.movements.length > 0;
    return {
      quantity: hasRealPosition ? null : 0,
      avgPrice: null,
      hasPartialData: hasRealPosition,
    };
  }

  return {
    quantity: Math.max(0, heldQuantity),
    avgPrice: buyQuantity > 0 ? buyCost / buyQuantity : null,
    hasPartialData,
  };
}

// Proventos recebidos (dividendos/JCP/rendimentos de FII) — só o tipo YIELD,
// separado de ADJUSTMENT, pra poder exibir como linha informativa à parte.
export function getDividendsTotal(investment: Investment): number {
  return investment.movements
    .filter((m) => m.type === 'YIELD')
    .reduce((sum, m) => sum + m.amount, 0);
}

export interface VariableResult {
  // Preço atual x quantidade quando temos posição completa; senão o saldo
  // que o backend já rastreia (fallback confiável pra investimentos sem
  // histórico de cotas neste navegador).
  totalValue: number;
  profit: number;
  profitPercent: number | null;
  // true = calculado a partir de quantidade/preço médio/cotação ao vivo
  // (mais preciso). false = caiu no fallback baseado no saldo do backend.
  isMarketBased: boolean;
}

// Resultado de renda variável: quando sabemos quantidade + preço médio (sem
// dados parciais) e temos cotação ao vivo, calculamos valor de mercado real
// (quantidade x cotação) contra o custo de aquisição. Sem isso, caímos no
// saldo/rendimento que o backend já rastreia via movimentações.
export function getVariableResult(
  investment: Investment,
  currentPrice: number | null,
): VariableResult {
  const position = getSharePosition(investment);
  const hasFullPosition =
    position.quantity !== null &&
    position.quantity > 0 &&
    position.avgPrice !== null &&
    !position.hasPartialData;

  if (hasFullPosition && currentPrice !== null) {
    const quantity = position.quantity as number;
    const avgPrice = position.avgPrice as number;
    const totalInvested = quantity * avgPrice;
    const totalValue = quantity * currentPrice;
    const profit = totalValue - totalInvested;
    return {
      totalValue,
      profit,
      profitPercent: totalInvested > 0 ? (profit / totalInvested) * 100 : null,
      isMarketBased: true,
    };
  }

  return {
    totalValue: investment.currentBalance,
    profit: getTotalYield(investment),
    profitPercent: getYieldPercentage(investment),
    isMarketBased: false,
  };
}

export interface CategorySummary {
  yieldTotal: number;
  investedTotal: number;
  yieldPercent: number | null;
}

// Resumo de renda fixa: só tem os movimentos do backend (sem cotação de
// mercado), então rendimento = YIELD + ADJUSTMENT sobre o total aportado.
export function getFixedCategorySummary(investments: Investment[]): CategorySummary {
  const yieldTotal = investments.reduce((s, inv) => s + getTotalYield(inv), 0);
  const investedTotal = investments.reduce((s, inv) => s + getTotalContributed(inv), 0);
  return {
    yieldTotal,
    investedTotal,
    yieldPercent: investedTotal > 0 ? (yieldTotal / investedTotal) * 100 : null,
  };
}

// Resumo de renda variável: usa o mesmo cálculo de cada card
// (getVariableResult) pra que o total bata com o que é exibido individualmente
// — inclui ganho/perda de mercado (quantidade x cotação viva), não só os
// movimentos de YIELD/ADJUSTMENT registrados manualmente.
export function getVariableCategorySummary(
  investments: Investment[],
  pricesByTicker: Record<string, number | null>,
): CategorySummary {
  let yieldTotal = 0;
  let investedTotal = 0;
  for (const inv of investments) {
    const currentPrice = inv.ticker ? (pricesByTicker[inv.ticker] ?? null) : null;
    const result = getVariableResult(inv, currentPrice);
    yieldTotal += result.profit;
    investedTotal += result.isMarketBased
      ? result.totalValue - result.profit
      : getTotalContributed(inv);
  }
  return {
    yieldTotal,
    investedTotal,
    yieldPercent: investedTotal > 0 ? (yieldTotal / investedTotal) * 100 : null,
  };
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export type InvestmentGroupMode = 'none' | 'institution';

export interface InvestmentGroup {
  key: string;
  label: string;
  items: Investment[];
}

const NO_INSTITUTION_KEY = '__none__';

function groupByInstitution(items: Investment[], noInstitutionLabel: string): InvestmentGroup[] {
  const map = new Map<string, Investment[]>();
  for (const inv of items) {
    const key = inv.institution?.trim() || NO_INSTITUTION_KEY;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(inv);
  }

  const keys = Array.from(map.keys()).sort((a, b) => {
    if (a === NO_INSTITUTION_KEY) return 1;
    if (b === NO_INSTITUTION_KEY) return -1;
    return a.localeCompare(b);
  });

  return keys.map((key) => ({
    key,
    label: key === NO_INSTITUTION_KEY ? noInstitutionLabel : key,
    items: map.get(key)!,
  }));
}

// Agrupa investimentos por instituição pra exibição na listagem (dentro de
// cada categoria renda fixa/variável, que já é a separação de mais alto nível).
export function groupInvestments(
  items: Investment[],
  mode: InvestmentGroupMode,
  noInstitutionLabel: string,
): InvestmentGroup[] {
  if (mode === 'none') {
    return [{ key: 'all', label: '', items }];
  }

  return groupByInstitution(items, noInstitutionLabel);
}
