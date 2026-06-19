import { useEffect, useState } from 'react';
import { RecurringTemplateForm, RecurringTemplateFormValues } from './RecurringTemplateForm';
import { Button } from '@/components/ui/button';
import { FlowType } from '@/lib/cashflow';
import { RecurringTemplate } from '@/modules/recurring-templates/service/recurring-templates-service';
import { useCreateRecurringTemplate } from '@/modules/recurring-templates/hooks/use-create-recurring-template';
import { useUpdateRecurringTemplate } from '@/modules/recurring-templates/hooks/use-update-recurring-template';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { recurringTemplateFormSchema } from '@/lib/schemas/recurring-templates';

interface RecurringTemplateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: RecurringTemplate;
}

const DEFAULT_VALUES: RecurringTemplateFormValues = {
  description: '',
  estimatedAmount: '',
  type: 'expense',
  dayOfMonth: 10,
  categoryId: undefined,
  endType: 'none',
  endDate: undefined,
  totalOccurrences: undefined,
};

export function RecurringTemplateDrawer({ open, onOpenChange, template }: RecurringTemplateDrawerProps) {
  const [values, setValues] = useState<RecurringTemplateFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<{ estimatedAmount?: string; endDate?: string; totalOccurrences?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateRecurringTemplate();
  const updateMutation = useUpdateRecurringTemplate();

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setSubmitError(null);

    setValues(
      template
        ? {
            description: template.description,
            estimatedAmount: template.estimatedAmount.toFixed(2).replace('.', ','),
            type: template.type.toLowerCase() as FlowType,
            dayOfMonth: template.dayOfMonth,
            categoryId: template.categoryId ?? undefined,
            endType: template.endDate ? 'date' : template.totalOccurrences ? 'count' : 'none',
            endDate: template.endDate ? template.endDate.slice(0, 10) : undefined,
            totalOccurrences: template.totalOccurrences ?? undefined,
          }
        : DEFAULT_VALUES,
    );
  }, [open, template]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  async function handleSave() {
    const result = recurringTemplateFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.errors) {
        const path = issue.path[0] as string;
        if (path === 'estimatedAmount') fieldErrors.estimatedAmount = issue.message;
        if (path === 'endDate') fieldErrors.endDate = issue.message;
        if (path === 'totalOccurrences') fieldErrors.totalOccurrences = issue.message;
      }
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) {
        setSubmitError(result.error.errors[0]?.message ?? 'Dados inválidos');
      }
      return;
    }

    setErrors({});
    setSubmitError(null);

    const numAmount = parseFloat(values.estimatedAmount.replace(',', '.'));
    const payload = {
      description: values.description,
      estimatedAmount: numAmount,
      type: values.type,
      dayOfMonth: values.dayOfMonth,
      categoryId: values.categoryId ?? undefined,
      endDate: values.endType === 'date' ? values.endDate : undefined,
      totalOccurrences: values.endType === 'count' ? values.totalOccurrences : undefined,
    };

    try {
      if (template) {
        await updateMutation.mutateAsync({ id: template.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(extractErrorMessage(err, 'Não foi possível salvar a conta recorrente'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader onClose={() => onOpenChange(false)}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            {template ? 'Editar Conta Recorrente' : 'Nova Conta Recorrente'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Contas como água, luz e condomínio que se repetem todo mês com um valor estimado.
          </p>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4">
          <RecurringTemplateForm values={values} onChange={setValues} errors={errors} />
          {submitError && (
            <p className="mt-3 text-sm font-medium text-balance-danger">{submitError}</p>
          )}
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>

          <Button
            className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
