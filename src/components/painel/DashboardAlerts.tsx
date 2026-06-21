import { useMemo } from 'react';
import { Period, formatCurrency, formatDateLong } from '@/lib/cashflow';
import { BalanceSettings } from '@/hooks/useCashFlow';
import { Card } from '@/components/ui/card';
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
      : period.days.find((d) => d.date > today && d.saldoAcumulado < balanceSettings.yellowThreshold);

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
    <div className="px-5 space-y-3">
      {dangerDay && (
        <Card className="bg-[#1c1a24] border-none rounded-2xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-white">{isDangerNow ? t('alreadyRed') : t('goingRed')}</p>
            <p className="text-xs text-red-400 font-medium tracking-wide">
              {isDangerNow
                ? formatCurrency(dangerDay.saldoAcumulado)
                : `${t('onDay', { date: formatDateLong(dangerDay.date) })} | ${formatCurrency(dangerDay.saldoAcumulado)}`}
            </p>
          </div>
        </Card>
      )}

      {warningDay && (
        <Card className="bg-[#1c1a24] border-none rounded-2xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-white">{isWarningNow ? t('alreadyWarning') : t('warningZone')}</p>
            <p className="text-xs text-amber-400 font-medium tracking-wide">
              {isWarningNow
                ? formatCurrency(warningDay.saldoAcumulado)
                : `${t('onDay', { date: formatDateLong(warningDay.date) })} | ${formatCurrency(warningDay.saldoAcumulado)}`}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
