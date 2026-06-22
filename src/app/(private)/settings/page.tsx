'use client';

import { useCashFlow } from '@/hooks/useCashFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AmountInputField, NumberInputField } from '@/components/ui/form-field';
import { DatePicker } from '@/components/ui/date-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, CalendarDays, Palette, Wallet, Save, Loader2, Download, Shield, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useTranslations';
import { getPeriodForDate } from '@/lib/cashflow';
import { useEffect, useMemo, useState } from 'react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { HttpClient } from '@/network/http-client';
import { useLogout } from '@/hooks/useLogout';
import { toast } from 'sonner';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const logout = useLogout();
  const { startDay, updateStartDay, balanceSettings, updateBalanceSettings, saldoInicial, updateSaldoInicial, isSavingBalance } = useCashFlow();

  const savedBalanceValue = saldoInicial.value.toFixed(2).replace('.', ',');
  const [balanceValue, setBalanceValue] = useState(savedBalanceValue);
  const [balanceDate, setBalanceDate] = useState(saldoInicial.date);

  useEffect(() => {
    setBalanceValue(savedBalanceValue);
    setBalanceDate(saldoInicial.date);
  }, [savedBalanceValue, saldoInicial.date]);

  const hasBalanceChanges = balanceValue !== savedBalanceValue || balanceDate !== saldoInicial.date;

  const handleSaveSaldoInicial = () => {
    const parsed = parseFloat(balanceValue.replace(',', '.'));
    if (Number.isNaN(parsed) || !balanceDate) return;
    updateSaldoInicial({ value: parsed, date: balanceDate });
  };

  const [localStartDay, setLocalStartDay] = useState(startDay);

  useEffect(() => {
    setLocalStartDay(startDay);
  }, [startDay]);

  const hasStartDayChanges = localStartDay !== startDay;

  const periodPreview = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return getPeriodForDate(today, localStartDay);
  }, [localStartDay]);

  const handleSaveStartDay = () => {
    updateStartDay(localStartDay);
  };

  const savedGreenValue = balanceSettings.greenThreshold.toFixed(2).replace('.', ',');
  const savedYellowValue = balanceSettings.yellowThreshold.toFixed(2).replace('.', ',');
  const [greenValue, setGreenValue] = useState(savedGreenValue);
  const [yellowValue, setYellowValue] = useState(savedYellowValue);

  useEffect(() => {
    setGreenValue(savedGreenValue);
    setYellowValue(savedYellowValue);
  }, [savedGreenValue, savedYellowValue]);

  const hasIndicatorChanges = greenValue !== savedGreenValue || yellowValue !== savedYellowValue;

  const handleSaveIndicators = () => {
    updateBalanceSettings({
      greenThreshold: parseFloat(greenValue.replace(',', '.')) || 0,
      yellowThreshold: parseFloat(yellowValue.replace(',', '.')) || 0,
    });
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await HttpClient.get<unknown>('/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nubolso-dados-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('deleteError'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await HttpClient.delete('/users/me');
      await logout();
    } catch {
      toast.error(t('deleteError'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </div>

      <Card className="glass-card border-none shadow-card-elegant overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('initialBalance')}</CardTitle>
          </div>
          <Button
            size="icon"
            onClick={handleSaveSaldoInicial}
            disabled={!hasBalanceChanges || isSavingBalance}
          >
            {isSavingBalance ? <Loader2 className="animate-spin" /> : <Save />}
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-xs text-muted-foreground mb-3">{t('initialBalanceDescription')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AmountInputField
              label={t('amount')}
              value={balanceValue}
              onChange={setBalanceValue}
              inputClassName="h-10 text-sm"
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                {t('referenceDate')}
              </label>
              <DatePicker date={balanceDate} onChange={setBalanceDate} className="h-10 text-sm px-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-card-elegant overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('billCycle')}</CardTitle>
          </div>
          <Button size="icon" onClick={handleSaveStartDay} disabled={!hasStartDayChanges}>
            <Save />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <NumberInputField
            id="start-day"
            label={t('cycleStartDay')}
            value={localStartDay}
            onChange={setLocalStartDay}
            min={1}
            max={31}
          />
          <p className="text-xs text-muted-foreground">
            {t('currentPeriod')}{' '}
            <span className="font-medium text-foreground">{periodPreview.startDate}</span>{' '}
            {t('to')}{' '}
            <span className="font-medium text-foreground">{periodPreview.endDate}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-card-elegant overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t('balanceIndicators')}</CardTitle>
            </div>
            <CardDescription className="text-xs">{t('balanceIndicatorsDescription')}</CardDescription>
          </div>
          <Button size="icon" onClick={handleSaveIndicators} disabled={!hasIndicatorChanges}>
            <Save />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {t('greenFrom')}
              </Label>
              <AmountInputField value={greenValue} onChange={setGreenValue} inputClassName="h-10 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                {t('yellowFrom')}
              </Label>
              <AmountInputField value={yellowValue} onChange={setYellowValue} inputClassName="h-10 text-sm" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">{t('belowYellow')}</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-card-elegant overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {t('language')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-card-elegant overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('lgpdTitle')}</CardTitle>
          </div>
          <CardDescription className="text-xs">{t('lgpdDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{t('exportData')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('exportDataDescription')}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-2 border-white/10 hover:bg-white/5"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? t('exporting') : t('exportData')}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-destructive">{t('deleteAccount')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('deleteAccountDescription')}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {isDeleting ? t('deleting') : t('deleteAccount')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('deleteConfirmMessage')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {t('deleteConfirmButton')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="text-xs text-muted-foreground">
            <Link href="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">
              Política de Privacidade
            </Link>
            {' · '}
            <Link href="/terms" className="text-primary underline underline-offset-2 hover:opacity-80">
              Termos de Uso
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
