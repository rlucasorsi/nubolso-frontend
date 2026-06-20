'use client';

import { useRef, useState } from 'react';
import { FileUp, FileCheck2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const ALLOWED_EXTENSIONS = /\.(ofx|qfx)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface OfxFileDropzoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
  onValidationError?: (message: string) => void;
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function OfxFileDropzone({ file, onChange, error, onValidationError }: OfxFileDropzoneProps) {
  const t = useTranslations('ofxDropzone');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function validateAndSet(candidate: File | undefined) {
    if (!candidate) return;

    if (!ALLOWED_EXTENSIONS.test(candidate.name)) {
      onChange(null);
      onValidationError?.(t('invalidFormat'));
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      onChange(null);
      onValidationError?.(t('fileTooLarge'));
      return;
    }

    onChange(candidate);
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          validateAndSet(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 text-center transition-colors cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : 'border-white/10 bg-surface-container hover:bg-white/5',
          file && 'cursor-default',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".ofx,.qfx"
          className="hidden"
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />

        {file ? (
          <>
            <div className="p-3 rounded-2xl bg-primary/10">
              <FileCheck2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold truncate max-w-[260px]">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {t('removeFile')}
            </button>
          </>
        ) : (
          <>
            <div className="p-3 rounded-2xl bg-white/5">
              <FileUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{t('dropHere')}</p>
              <p className="text-xs text-muted-foreground">{t('dropHint')}</p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs font-medium text-destructive pl-1">{error}</p>}
    </div>
  );
}
