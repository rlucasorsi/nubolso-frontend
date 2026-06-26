import { useMemo } from 'react';
import { Period, formatCurrency, formatDateLong } from '@/lib/cashflow';
import { BalanceSettings } from '@/hooks/useCashFlow';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';

interface DashboardAlertsProps {
  period: Period;
  today: string;
  balanceSettings: BalanceSettings;
}

export function DashboardAlerts({ period, today, balanceSettings }: DashboardAlertsProps) {
  const t = useTranslations('dashboard');

  const { dangerDay, warningDay, isDangerNow, isWarningNow } = useMemo(() => {
    const todayDay = period.days.find((d) => d.date === today);
    const isDangerNow = !!todayDay && todayDay.saldoAcumulado < balanceSettings.yellowThreshold;
    const isWarningNow =
      !!todayDay &&
      todayDay.saldoAcumulado >= balanceSettings.yellowThreshold &&
      todayDay.saldoAcumulado < balanceSettings.greenThreshold;

    const dangerDay = isDangerNow
      ? todayDay
      : period.days.find(
          (d) => d.date > today && d.saldoAcumulado < balanceSettings.yellowThreshold,
        );

    const warningDay = isWarningNow
      ? todayDay
      : period.days.find(
          (d) =>
            d.date > today &&
            d.saldoAcumulado >= balanceSettings.yellowThreshold &&
            d.saldoAcumulado < balanceSettings.greenThreshold,
        );

    return { dangerDay, warningDay, isDangerNow, isWarningNow };
  }, [period, today, balanceSettings]);

  if (!dangerDay && !warningDay) return null;

  return (
    <div className="space-y-2">
      {dangerDay && (
        <div className="flex items-center gap-3 rounded-xl border-l-2 border-red-500 bg-red-500/5 px-4 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs font-medium text-red-400">
            {isDangerNow ? t('alreadyRed') : t('goingRed')}
          </p>
          <p className="text-xs text-red-400 ml-auto">
            {isDangerNow
              ? formatCurrency(dangerDay.saldoAcumulado)
              : `${formatDateLong(dangerDay.date)} · ${formatCurrency(dangerDay.saldoAcumulado)}`}
          </p>
        </div>
      )}

      {warningDay && (
        <div className="flex items-center gap-3 rounded-xl border-l-2 border-amber-400 bg-amber-400/5 px-4 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-xs font-medium text-amber-400">
            {isWarningNow ? t('alreadyWarning') : t('warningZone')}
          </p>
          <p className="text-xs text-amber-400 ml-auto">
            {isWarningNow
              ? formatCurrency(warningDay.saldoAcumulado)
              : `${formatDateLong(warningDay.date)} · ${formatCurrency(warningDay.saldoAcumulado)}`}
          </p>
        </div>
      )}
    </div>
  );
}
