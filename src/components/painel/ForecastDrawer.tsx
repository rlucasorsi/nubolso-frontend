'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { AmountInputField } from '@/components/ui/form-field';
import { formatDateLong } from '@/lib/cashflow';
import { TrendingDown, Trash2 } from 'lucide-react';

interface ForecastDrawerProps {
  open: boolean;
  onClose: () => void;
  date?: string;
  currentForecast: number;
  onSave: (amount: number) => void;
  onDelete: () => void;
}

export function ForecastDrawer({
  open,
  onClose,
  date,
  currentForecast,
  onSave,
  onDelete,
}: ForecastDrawerProps) {
  const [amount, setAmount] = useState('0,00');

  useEffect(() => {
    if (!open) return;
    setAmount(currentForecast > 0 ? currentForecast.toFixed(2).replace('.', ',') : '0,00');
  }, [open, currentForecast]);

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const canSave = parsedAmount > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(parsedAmount);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader
          onClose={onClose}
          actions={
            currentForecast > 0 ? (
              <button
                type="button"
                onClick={handleDelete}
                title="Remover previsão"
                className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : undefined
          }
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">Previsão de Gasto</SheetTitle>
              {date && (
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {formatDateLong(date)}
                </p>
              )}
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 px-6 py-6">
          <AmountInputField
            label="Valor previsto"
            value={amount}
            onChange={setAmount}
            autoFocus
          />
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all disabled:opacity-30 disabled:shadow-none disabled:hover:scale-100"
          >
            Salvar Previsão
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
