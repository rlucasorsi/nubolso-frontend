import { FlowType } from '@/lib/cashflow';
import { TypeToggle } from './TypeToggle';
import { TextInputField, AmountInputField, DateInputField } from '@/components/ui/form-field';
import { CategorySelect } from './CategorySelect';

export interface EntryFormValues {
  date: string;
  amount: string;
  type: FlowType;
  description: string;
  categoryId?: string;
}

interface EntryFormProps {
  values: EntryFormValues;
  onChange: (values: EntryFormValues) => void;
  errors?: { date?: string; amount?: string };
  minDate?: string;
}

export function EntryForm({ values, onChange, errors, minDate }: EntryFormProps) {
  return (
    <div className="space-y-4">
      <DateInputField
        label="Data do Lançamento"
        required
        value={values.date}
        onChange={(date) => onChange({ ...values, date })}
        minDate={minDate}
        error={errors?.date}
      />

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
        placeholder="Descrição"
        value={values.description}
        onChange={(description) => onChange({ ...values, description })}
      />

      <AmountInputField
        label="Valor"
        required
        value={values.amount}
        onChange={(amount) => onChange({ ...values, amount })}
        error={errors?.amount}
      />
    </div>
  );
}
