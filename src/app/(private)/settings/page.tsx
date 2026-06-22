'use client';

import { useCashFlow } from '@/hooks/useCashFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { ChevronLeft, CalendarDays, Palette, Wallet, Save, Loader2, Download, Shield, Trash2, HelpCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useTranslations';
import { getPeriodForDate } from '@/lib/cashflow';
import { useEffect, useMemo, useState } from 'react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SupportDrawer } from '@/components/support/SupportDrawer';
import { useGetMe } from '@/modules/users/hooks/use-get-me';
import { HttpClient } from '@/network/http-client';
import { useLogout } from '@/hooks/useLogout';
import { toast } from 'sonner';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tn = useTranslations('nav');
  const tc = useTranslations('common');
  const logout = useLogout();
  const { data: me } = useGetMe();
  const [supportOpen, setSupportOpen] = useState(false);
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

      <Tabs defaultValue="system">
        <TabsList className="w-full bg-transparent h-auto p-0 border-b border-white/10 rounded-none justify-start gap-0">
          <TabsTrigger
            value="system"
            className="relative h-11 px-5 rounded-none bg-transparent border-0 shadow-none text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:transition-transform after:duration-200 data-[state=active]:after:scale-x-100"
          >
            {t('tabSystem')}
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="relative h-11 px-5 rounded-none bg-transparent border-0 shadow-none text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:transition-transform after:duration-200 data-[state=active]:after:scale-x-100"
          >
            {t('tabAccount')}
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="relative h-11 px-5 rounded-none bg-transparent border-0 shadow-none text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:transition-transform after:duration-200 data-[state=active]:after:scale-x-100"
          >
            {t('tabFaq')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4 mt-4">
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
              <CardTitle className="text-base">{t('language')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <LanguageSwitcher />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 mt-4">
          <Card className="glass-card border-none shadow-card-elegant overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                {tn('faq')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <Link
                href="/faq"
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors"
              >
                <p className="text-sm font-medium">{tn('faq')}</p>
                <span className="text-xs text-muted-foreground">→</span>
              </Link>
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className="w-full flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{tn('support')}</p>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </button>
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
        </TabsContent>

        <TabsContent value="faq" className="space-y-2 mt-4">
          {[
            { q: 'O que é o NuBolso?', a: 'Um aplicativo de controle financeiro pessoal. Registre entradas e saídas, acompanhe faturas de cartão de crédito, crie metas e visualize projeções de saldo.' },
            { q: 'Como configuro o saldo inicial?', a: 'Em Sistema → Saldo Inicial. Informe o valor que você tinha em uma data de referência e o app calcula o saldo dia a dia a partir daí.' },
            { q: 'O que é o "Período do Mês"?', a: 'Define quando começa o seu mês financeiro. Se suas contas chegam todo dia 10, configure o início no dia 10 e o painel refletirá esse ciclo.' },
            { q: 'Como funciona o cartão de crédito?', a: 'Adicione seu cartão em Cartões com os dias de fechamento e vencimento. Compras parceladas são distribuídas automaticamente nas faturas corretas.' },
            { q: 'O que é antecipar parcelas?', a: 'Permite pagar parcelas futuras na fatura atual com desconto. Na tela de detalhe da fatura, clique em "Antecipar" na compra e informe o valor negociado.' },
            { q: 'Posso importar meu extrato bancário?', a: 'Sim. Acesse Lançamentos → Importar e selecione um arquivo OFX exportado pelo seu banco. O app identifica duplicatas automaticamente.' },
            { q: 'Posso criar transações recorrentes?', a: 'Sim. Em Recorrentes, cadastre contas fixas (aluguel, assinaturas, etc.) com valor estimado e dia de vencimento.' },
            { q: 'Como exportar meus dados?', a: 'Em Conta → Meus Dados → Exportar meus dados. Um JSON com todas as suas informações será baixado.' },
            { q: 'Como excluir minha conta?', a: 'Em Conta → Meus Dados → Excluir conta. Confirme na tela de confirmação. A ação é permanente e não pode ser desfeita.' },
            { q: 'Como falo com o suporte?', a: 'Use o formulário em Conta → Suporte ou pelo ícone de balão no menu lateral. Respondemos em até 2 dias úteis.' },
          ].map((faq, i) => (
            <details key={i} className="group glass-card border border-white/10 rounded-2xl overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none hover:bg-white/5 transition-colors">
                <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                <span className="shrink-0 text-muted-foreground text-lg leading-none transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </TabsContent>
      </Tabs>

      <SupportDrawer
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        defaultName={me?.name}
        defaultEmail={me?.email}
      />
    </div>
  );
}
