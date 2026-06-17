'use client';

import { useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowRight } from 'lucide-react';
import { useUpdateMe } from '@/modules/users/hooks/use-update-me';

interface InitialSetupDrawerProps {
  open: boolean;
}

export function InitialSetupDrawer({ open }: InitialSetupDrawerProps) {
  const updateMeMutation = useUpdateMe();
  const [value, setValue] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const parsedValue = parseFloat(value.replace(',', '.'));
  const isFormValid = value !== '' && !Number.isNaN(parsedValue) && Boolean(date);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    await updateMeMutation.mutateAsync({
      currentBalance: parsedValue,
      balanceStartDate: date,
    });
  };

  return (
    <Sheet open={open} onOpenChange={() => {}}>
      <DrawerContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DrawerHeader>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            Vamos começar!
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Informe seu saldo atual e a data de referência para ele. A partir
            dessa data, seus lançamentos serão somados ou subtraídos a partir
            desse valor para calcular o saldo de cada dia.
          </SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 pb-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Saldo Atual
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold font-display text-primary">
                R$
              </span>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                type="number"
                className="glass-input h-14 pl-12 text-xl font-bold font-display rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Data de Referência
            </Label>
            <DatePicker date={date} onChange={setDate} className="h-12" />
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || updateMeMutation.isPending}
            className="w-full h-11 bg-gradient-primary text-white font-bold rounded-xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            {updateMeMutation.isPending ? 'Salvando...' : 'Começar'}
            {!updateMeMutation.isPending && (
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
