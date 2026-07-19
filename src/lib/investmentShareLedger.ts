// A API de investimentos não guarda quantidade/preço por cota em nenhum
// movimento — só valor em dinheiro. Pra mostrar "quantidade total" e "preço
// médio" de FIIs/ações, guardamos essa informação aqui, neste navegador,
// associada ao id de cada movimento. É um cache local: some se o usuário
// limpar o navegador ou acessar de outro dispositivo — nesse caso os
// cálculos degradam para "dados parciais" em vez de quebrar.

interface ShareEntry {
  quantity: number;
  pricePerShare: number;
}

const STORAGE_KEY = 'nubolso_investment_share_ledger_v1';

function readStore(): Record<string, ShareEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ShareEntry>) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, ShareEntry>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage cheio ou indisponível (modo privado) — degrada silenciosamente.
  }
}

function movementKey(investmentId: string, movementId: string) {
  return `iv:${investmentId}:mv:${movementId}`;
}

export function setMovementSharePosition(
  investmentId: string,
  movementId: string,
  quantity: number,
  pricePerShare: number,
) {
  const store = readStore();
  store[movementKey(investmentId, movementId)] = { quantity, pricePerShare };
  writeStore(store);
}

export function getMovementSharePosition(
  investmentId: string,
  movementId: string,
): ShareEntry | undefined {
  return readStore()[movementKey(investmentId, movementId)];
}

export function clearMovementSharePosition(investmentId: string, movementId: string) {
  const store = readStore();
  delete store[movementKey(investmentId, movementId)];
  writeStore(store);
}

export function clearInvestmentSharePositions(investmentId: string) {
  const store = readStore();
  const prefix = `iv:${investmentId}:`;
  for (const key of Object.keys(store)) {
    if (key.startsWith(prefix)) delete store[key];
  }
  writeStore(store);
}
