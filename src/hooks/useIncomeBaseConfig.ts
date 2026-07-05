'use client';

import { useCallback, useEffect, useState } from 'react';

// Ajustes do usuário para a "base de entradas válidas" do gráfico de despesas
// sobre entradas. Persistidos em localStorage:
// - overrides: por lançamento (id único) — liga/desliga uma entrada específica
//   (ex.: 13º) independente do padrão da categoria. Global entre períodos.
// - manual: valor arbitrário por período (chave = startDate do período).
const OVERRIDES_KEY = 'cashflow_income_base_overrides';
const MANUAL_KEY = 'cashflow_income_base_manual';

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useIncomeBaseConfig(periodKey: string) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>(() =>
    readJSON(OVERRIDES_KEY, {}),
  );
  const [manualMap, setManualMap] = useState<Record<string, number>>(() =>
    readJSON(MANUAL_KEY, {}),
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    }
  }, [overrides]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MANUAL_KEY, JSON.stringify(manualMap));
    }
  }, [manualMap]);

  const manualValue = periodKey in manualMap ? manualMap[periodKey] : null;

  const setManualValue = useCallback(
    (value: number | null) => {
      setManualMap((prev) => {
        const next = { ...prev };
        if (value === null) delete next[periodKey];
        else next[periodKey] = value;
        return next;
      });
    },
    [periodKey],
  );

  const setEntryOverride = useCallback((id: string, counts: boolean) => {
    setOverrides((prev) => ({ ...prev, [id]: counts }));
  }, []);

  return { overrides, setEntryOverride, manualValue, setManualValue };
}
