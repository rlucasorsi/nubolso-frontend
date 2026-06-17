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
import { createGoalSchema } from '@/lib/schemas/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AmountInputField } from '@/components/ui/form-field';
import {
  X,
  ArrowRight,
  Shield,
  Plane,
  Smartphone,
  Home,
  Car,
  GraduationCap,
  Wallet,
  Heart,
  Laptop,
  PiggyBank,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';

const ICON_OPTIONS = [
  { name: 'home', label: 'Casa', Icon: Home },
  { name: 'directions_car', label: 'Carro', Icon: Car },
  { name: 'flight_takeoff', label: 'Viagem', Icon: Plane },
  { name: 'school', label: 'Estudo', Icon: GraduationCap },
  { name: 'payments', label: 'Dinheiro', Icon: Wallet },
  { name: 'volunteer_activism', label: 'Vida', Icon: Heart },
  { name: 'laptop_mac', label: 'Tech', Icon: Laptop },
  { name: 'shield', label: 'Reserva', Icon: Shield },
  { name: 'smartphone', label: 'Celular', Icon: Smartphone },
  { name: 'savings', label: 'Poupança', Icon: PiggyBank },
];

interface CreateGoalDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    icon: string;
    targetAmount: number;
    deadline: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function CreateGoalDrawer({
  open,
  onClose,
  onSubmit,
  isLoading,
}: CreateGoalDrawerProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('home');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTargetAmount('');
    setDeadline('');
    setSelectedIcon('home');
    setFormError(null);
  };

  const handleSubmit = async () => {
    const result = createGoalSchema.safeParse({
      name,
      description,
      icon: selectedIcon,
      targetAmount,
      deadline,
    });
    if (!result.success) {
      setFormError(result.error.errors[0]?.message ?? 'Dados inválidos');
      return;
    }

    setFormError(null);
    await onSubmit({
      name,
      description,
      icon: selectedIcon,
      targetAmount: parseFloat(targetAmount.replace(',', '.')),
      deadline,
    });
    resetForm();
  };

  const isFormValid = name.trim() && targetAmount && parseFloat(targetAmount.replace(',', '.')) > 0 && deadline;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            Nova Meta Financeira
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Defina seus objetivos e comece a poupar hoje.
          </SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 pb-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Nome da Meta
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Viagem dos Sonhos"
              className="glass-input h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Descrição
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ex: Eurotrip 15 dias"
              className="glass-input h-12 rounded-xl"
            />
          </div>

          <AmountInputField
            label="Valor Alvo"
            value={targetAmount}
            onChange={setTargetAmount}
          />

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Prazo Estimado
            </Label>
            <DatePicker
              date={deadline}
              onChange={setDeadline}
              className="h-12"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Ícone Representativo
            </Label>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
              {ICON_OPTIONS.map((opt) => {
                const isActive = selectedIcon === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setSelectedIcon(opt.name)}
                    className={cn(
                      'flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90',
                      isActive
                        ? 'bg-gradient-primary text-white shadow-glow ring-1 ring-white/10'
                        : 'glass-card text-muted-foreground hover:bg-white/5 border-border/20'
                    )}
                  >
                    <opt.Icon className="h-6 w-6" />
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        <DrawerFooter>
          {formError && (
            <p className="text-xs text-destructive text-center pb-1">{formError}</p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className="w-full h-11 bg-gradient-primary text-white font-bold rounded-xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            {isLoading ? 'Criando...' : 'Criar Objetivo'}
            {!isLoading && (
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}

