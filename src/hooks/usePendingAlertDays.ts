import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pending_alert_days';
export const DEFAULT_ALERT_DAYS = 3;

export function usePendingAlertDays() {
  const [alertDays, setAlertDays] = useState(DEFAULT_ALERT_DAYS);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = parseInt(raw ?? '', 10);
    if (!isNaN(parsed) && parsed >= 0) setAlertDays(parsed);
  }, []);

  const updateAlertDays = useCallback((days: number) => {
    localStorage.setItem(STORAGE_KEY, String(days));
    setAlertDays(days);
  }, []);

  return { alertDays, updateAlertDays };
}

export function addDaysToDateStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export type AlertStatus = 'overdue' | 'upcoming';

export function getPendingAlertStatus(
  entryDate: string,
  today: string,
  alertDays: number,
): AlertStatus | null {
  if (entryDate < today) return 'overdue';
  if (entryDate <= addDaysToDateStr(today, alertDays)) return 'upcoming';
  return null;
}

export function daysUntil(today: string, entryDate: string): number {
  const a = new Date(today + 'T00:00:00');
  const b = new Date(entryDate + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
