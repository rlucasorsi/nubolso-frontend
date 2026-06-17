import { FlowType } from '@/lib/cashflow';
import { TypeToggle } from './TypeToggle';
import { TextInputField, AmountInputField, NumberInputField } from '@/components/ui/form-field';
import { CategorySelect } from './CategorySelect';

export interface RecurringTemplateFormValues {
  description: string;
  estimatedAmount: string;
  type: FlowType;
  dayOfMonth: number;
  categoryId?: string;
}

interface RecurringTemplateFormProps {
  values: RecurringTemplateFormValues;
  onChange: (values: RecurringTemplateFormValues) => void;
  error?: string;
}

export function RecurringTemplateForm({ values, onChange, error }: RecurringTemplateFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tipo de Lançamento <span className="text-balance-danger">*</span>
        </label>
        <TypeToggle
          value={values.type}
          onChange={(type) => onChange({ ...values, type })}
        />
      </div>

      {/* <CategorySelect
        type={values.type}
        value={values.categoryId}
        onChange={(categoryId) => onChange({ ...values, categoryId })}
      /> */}

      <TextInputField
        label="Descrição"
        required
        placeholder="Ex: Conta de água"
        value={values.description}
        onChange={(description) => onChange({ ...values, description })}
      />

      <AmountInputField
        label="Valor Estimado"
        required
        value={values.estimatedAmount}
        onChange={(estimatedAmount) => onChange({ ...values, estimatedAmount })}
        error={error}
      />

      <NumberInputField
        label="Dia do Vencimento"
        value={values.dayOfMonth}
        onChange={(dayOfMonth) => onChange({ ...values, dayOfMonth })}
        min={1}
        max={31}
      />
    </div>
  );
}
