'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from '@/components/ui/command';
import { useTranslations } from '@/i18n/useTranslations';

interface InstitutionComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
  error?: string;
}

export function InstitutionCombobox({
  label,
  value,
  onChange,
  options,
  required,
  placeholder,
  error,
}: InstitutionComboboxProps) {
  const t = useTranslations('createInvestmentDrawer');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim();
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(normalizedQuery.toLowerCase()),
  );
  const hasExactMatch = options.some(
    (opt) => opt.toLowerCase() === normalizedQuery.toLowerCase(),
  );
  const canCreate = normalizedQuery.length > 0 && !hasExactMatch;

  const selectOption = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
        {label} {required && <span className="text-balance-danger">*</span>}
      </label>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setQuery('');
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full h-11 justify-between font-normal rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-base px-4',
              !value && 'text-muted-foreground',
              error && 'border-balance-danger',
            )}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-white/10 shadow-2xl rounded-2xl overflow-hidden"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder={placeholder} />
            <CommandList>
              {filteredOptions.length === 0 && !canCreate && (
                <CommandEmpty>{t('noInstitutions')}</CommandEmpty>
              )}
              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((opt) => (
                    <CommandItem
                      key={opt}
                      value={opt}
                      onSelect={() => selectOption(opt)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === opt ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {opt}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {canCreate && (
                <CommandGroup>
                  <CommandItem
                    value={`__create__${normalizedQuery}`}
                    onSelect={() => selectOption(normalizedQuery)}
                    className="cursor-pointer text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('createInstitutionOption', { name: normalizedQuery })}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs font-medium text-balance-danger">{error}</p>}
    </div>
  );
}
