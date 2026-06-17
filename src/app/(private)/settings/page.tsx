'use client';

import { useCashFlow } from '@/hooks/useCashFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AmountInputField, NumberInputField } from '@/components/ui/form-field';
import { DatePicker } from '@/components/ui/date-picker';
import { ChevronLeft, CalendarDays, Palette, Wallet, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getPeriodForDate } from '@/lib/cashflow';
import { useEffect, useMemo, useState } from 'react';

export default function ConfiguracoesPage() {
  const { startDay, updateStartDay, balanceSettings, updateBalanceSettings, saldoInicial, updateSaldoInicial, isSavingBalance } = useCashFlow();

  // Saldo Inicial
  const savedBalanceValue = saldoInicial.value.toFixed(2).replace('.', ',');
  const [balanceValue, setBalanceValue] = useState(savedBalanceValue);
  const [balanceDate, setBalanceDate] = useState(saldoInicial.date);

  useEffect(() => {
    setBalanceValue(savedBalanceValue);
    setBalanceDate(saldoInicial.date);
  }, [saldoInicial.value, saldoInicial.date]);

  const hasBalanceChanges = balanceValue !== savedBalanceValue || balanceDate !== saldoInicial.date;

  const handleSaveSaldoInicial = () => {
    const parsed = parseFloat(balanceValue.replace(',', '.'));
    if (Number.isNaN(parsed) || !balanceDate) return;
    updateSaldoInicial({ value: parsed, date: balanceDate });
  };

  // Ciclo de Faturamento
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

  // Indicadores de Saldo
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

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/painel">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Configurações</h1>
      </div>

      <Card className="glass-card border-none shadow-card-elegant overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Saldo Inicial</CardTitle>
          </div>
          <Button
            size="icon"
            onClick={handleSaveSaldoInicial}
            disabled={!hasBalanceChanges || isSavingBalance}
            title="Salvar saldo inicial"
          >
            {isSavingBalance ? <Loader2 className="animate-spin" /> : <Save />}
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            Ponto de partida do saldo. Dias anteriores à data não têm saldo calculado.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AmountInputField
              label="Valor (R$)"
              value={balanceValue}
              onChange={setBalanceValue}
              inputClassName="h-10 text-sm"
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                Data de Referência
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
            <CardTitle className="text-base">Ciclo de Faturamento</CardTitle>
          </div>
          <Button
            size="icon"
            onClick={handleSaveStartDay}
            disabled={!hasStartDayChanges}
            title="Salvar ciclo de faturamento"
          >
            <Save />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <NumberInputField
            id="start-day"
            label="Dia de início do ciclo"
            value={localStartDay}
            onChange={setLocalStartDay}
            min={1}
            max={31}
          />
          <p className="text-xs text-muted-foreground">
            Período atual: <span className="font-medium text-foreground">{periodPreview.startDate}</span> a{' '}
            <span className="font-medium text-foreground">{periodPreview.endDate}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-card-elegant overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Indicadores de Saldo</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Limites que definem as cores do saldo diário.
            </CardDescription>
          </div>
          <Button
            size="icon"
            onClick={handleSaveIndicators}
            disabled={!hasIndicatorChanges}
            title="Salvar indicadores de saldo"
          >
            <Save />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Verde a partir de (R$)
              </Label>
              <AmountInputField
                value={greenValue}
                onChange={setGreenValue}
                inputClassName="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                Amarelo a partir de (R$)
              </Label>
              <AmountInputField
                value={yellowValue}
                onChange={setYellowValue}
                inputClassName="h-10 text-sm"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Abaixo do valor amarelo, o indicador fica vermelho.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
