'use client';

import { useEffect, useState } from 'react';
import { setQuickAddHandler } from '@/lib/quickAdd';
import { AddEntryDrawer } from '@/components/painel/AddEntryDrawer';
import { useGetMe } from '@/modules/users/hooks/use-get-me';
import { useCreateEntry } from '@/modules/entries/hooks/use-create-entry';
import type { EntryFormValues } from '@/components/painel/EntryForm';

export function GlobalQuickAdd() {
  const [open, setOpen] = useState(false);
  const { data: me } = useGetMe();
  const createEntry = useCreateEntry();

  const minDate = me?.balanceStartDate ? me.balanceStartDate.split('T')[0] : undefined;

  useEffect(() => {
    setQuickAddHandler(() => setOpen(true));
    return () => setQuickAddHandler(null);
  }, []);

  const handleSave = (values: EntryFormValues) => {
    createEntry.mutate({
      date: values.date,
      amount: parseFloat(values.amount.replace(',', '.')),
      type: values.type,
      description: values.description ?? '',
      categoryId: values.categoryId,
    });
    setOpen(false);
  };

  return (
    <AddEntryDrawer
      hideTrigger
      isOpen={open}
      onOpen={() => setOpen(true)}
      onSave={handleSave}
      onCancel={() => setOpen(false)}
      minDate={minDate}
    />
  );
}
