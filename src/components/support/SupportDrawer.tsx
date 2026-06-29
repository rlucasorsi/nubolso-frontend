'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { TextInputField } from '@/components/ui/form-field';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { HttpClient } from '@/network/http-client';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

interface SupportDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
}

const SUBJECTS = ['subjectQuestion', 'subjectBug', 'subjectSuggestion', 'subjectOther'] as const;

export function SupportDrawer({
  open,
  onClose,
  defaultName = '',
  defaultEmail = '',
}: SupportDrawerProps) {
  const t = useTranslations('support');

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setEmail(defaultEmail);
      setSubject(SUBJECTS[0]);
      setMessage('');
      setSending(false);
      setSuccess(false);
      setError(null);
    }
  }, [open, defaultName, defaultEmail]);

  const handleSubmit = async () => {
    setError(null);
    setSending(true);
    try {
      await HttpClient.post(
        '/support',
        {
          name,
          email,
          subject: t(subject as (typeof SUBJECTS)[number]),
          message,
        },
        { includeToken: false },
      );
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err, t('errorMessage')));
    } finally {
      setSending(false);
    }
  };

  const isValid = name.trim().length > 0 && email.includes('@') && message.trim().length >= 10;

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-all';

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            {t('title')}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4">
          {success ? (
            <div className="flex flex-col items-center text-center gap-4 py-10">
              <CheckCircle2 className="h-14 w-14 text-emerald-400" />
              <div className="space-y-1">
                <p className="text-lg font-bold">{t('successTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('successMessage')}</p>
              </div>
              <Button
                className="mt-2 h-10 px-6 rounded-xl bg-primary text-white font-bold"
                onClick={() => setSuccess(false)}
              >
                {t('newMessage')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInputField label={t('nameLabel')} required value={name} onChange={setName} />
                <TextInputField
                  label={t('emailLabel')}
                  required
                  type="email"
                  value={email}
                  onChange={setEmail}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                  {t('subjectLabel')}
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-background">
                      {t(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                  {t('messageLabel')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('messagePlaceholder')}
                  rows={5}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {error && <p className="text-xs text-destructive px-1">{error}</p>}

              <Link
                href="/faq"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:opacity-80 transition-opacity"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {t('faqLink')}
              </Link>
            </div>
          )}
        </div>

        {!success && (
          <DrawerFooter>
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all"
              onClick={handleSubmit}
              disabled={!isValid || sending}
            >
              {sending ? t('sending') : t('send')}
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Sheet>
  );
}
