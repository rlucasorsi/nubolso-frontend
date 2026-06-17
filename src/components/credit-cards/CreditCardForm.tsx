import { TextInputField, NumberInputField } from '@/components/ui/form-field';

export interface CreditCardFormValues {
  name: string;
  closingDay: number;
  dueDay: number;
  paymentDay: number;
}

interface CreditCardFormProps {
  values: CreditCardFormValues;
  onChange: (values: CreditCardFormValues) => void;
  error?: string;
}

export function CreditCardForm({ values, onChange, error }: CreditCardFormProps) {
  return (
    <div className="space-y-4">
      <TextInputField
        label="Nome do Cartão"
        required
        placeholder="Ex: Nubank, Inter, Itaú..."
        value={values.name}
        onChange={(name) => onChange({ ...values, name })}
        error={error}
      />

      <NumberInputField
        label="Dia de Fechamento"
        value={values.closingDay}
        onChange={(closingDay) => onChange({ ...values, closingDay })}
        min={1}
        max={31}
      />

      <NumberInputField
        label="Dia de Vencimento"
        value={values.dueDay}
        onChange={(dueDay) => onChange({ ...values, dueDay })}
        min={1}
        max={31}
      />

      <div className="space-y-2">
        <NumberInputField
          label="Dia de Pagamento"
          value={values.paymentDay}
          onChange={(paymentDay) => onChange({ ...values, paymentDay })}
          min={1}
          max={31}
        />
        <p className="text-xs text-muted-foreground pl-1">
          Dia em que a fatura impacta o seu saldo no fluxo de caixa.
        </p>
      </div>
    </div>
  );
}
