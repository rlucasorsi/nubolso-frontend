import * as React from "react"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"

interface BaseFieldProps {
  label: string
  required?: boolean
  error?: string
  className?: string
}

interface TextInputFieldProps extends BaseFieldProps, Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
}

export function TextInputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  className,
  ...props
}: TextInputFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
        {label} {required && <span className="text-balance-danger">*</span>}
      </label>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-base w-full"
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-balance-danger">{error}</p>
      )}
    </div>
  )
}

interface AmountInputFieldProps extends Omit<BaseFieldProps, 'label'>, Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  label?: string
  value: string
  onChange: (value: string) => void
  inputClassName?: string
}

export function AmountInputField({
  label,
  value,
  onChange,
  placeholder = "0,00",
  required,
  error,
  className,
  inputClassName,
  ...props
}: AmountInputFieldProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const cents = digits ? parseInt(digits, 10) : 0;
    onChange((cents / 100).toFixed(2).replace('.', ','));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
          {label} {required && <span className="text-balance-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold pointer-events-none">
          R$
        </span>
        <Input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={handleAmountChange}
          className={cn(
            "text-lg pl-11 w-full text-left",
            error ? 'border-balance-danger focus-visible:ring-balance-danger' : '',
            inputClassName
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-balance-danger">{error}</p>
      )}
    </div>
  )
}

interface NumberInputFieldProps extends Omit<BaseFieldProps, 'className'> {
  id?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
  className?: string
}

export function NumberInputField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  required,
  error,
  className,
}: NumberInputFieldProps) {
  const [text, setText] = React.useState(String(value))

  React.useEffect(() => {
    setText(String(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setText(raw)

    if (raw === '') return

    const parsed = Number(raw)
    if (Number.isNaN(parsed)) return
    onChange(parsed)
  }

  const handleBlur = () => {
    const parsed = Number(text)
    const clamped = Number.isNaN(parsed) ? min : Math.min(Math.max(parsed, min), max)
    setText(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-end">
        <label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
          {label} {required && <span className="text-balance-danger">*</span>}
        </label>
        <span className="text-[10px] text-muted-foreground font-medium pr-1">
          Mín: {min} · Máx: {max}
        </span>
      </div>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          onWheel={(e) => e.currentTarget.blur()}
          className={cn(
            "text-base w-full",
            suffix ? "pr-10" : "",
            error ? 'border-balance-danger focus-visible:ring-balance-danger' : ''
          )}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-balance-danger">{error}</p>
      )}
    </div>
  )
}

interface DateInputFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minDate?: string
}

export function DateInputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  className,
  minDate
}: DateInputFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
        {label} {required && <span className="text-balance-danger">*</span>}
      </label>
      <DatePicker
        date={value}
        onChange={onChange}
        placeholder={placeholder}
        minDate={minDate}
      />
      {error && (
        <p className="text-xs font-medium text-balance-danger">{error}</p>
      )}
    </div>
  )
}
