'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { FileSpreadsheet, CheckCircle2, Upload, ChevronLeft } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServerErrorState } from '@/components/ui/server-error-state';
import { OfxFileDropzone } from './OfxFileDropzone';
import { ImportReviewStep } from './ImportReviewStep';
import { useGetImportBatches } from '@/modules/imports/hooks/use-get-import-batches';
import { useUploadOfx } from '@/modules/imports/hooks/use-upload-ofx';
import { useRollbackImport } from '@/modules/imports/hooks/use-rollback-import';
import type { ImportBatch, ImportBatchDetail, ImportBatchStatus } from '@/modules/imports/model/api/ofx-import';

type Step = 'list' | 'upload' | 'review' | 'success';

export function ImportOfxDrawer() {
  const t = useTranslations('import');
  const { locale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('list');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [successBatch, setSuccessBatch] = useState<ImportBatchDetail | null>(null);

  const batchesQuery = useGetImportBatches(isOpen);
  const uploadOfx = useUploadOfx();
  const rollbackImport = useRollbackImport();

  const STATUS_LABEL: Record<ImportBatchStatus, { label: string; className: string }> = {
    PENDING_REVIEW: { label: t('statusPendingReview'), className: 'border-amber-400/30 text-amber-400 bg-amber-400/10' },
    CONFIRMED: { label: t('statusConfirmed'), className: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' },
    CANCELED: { label: t('statusCanceled'), className: 'border-white/10 text-muted-foreground bg-white/[0.02]' },
    ROLLED_BACK: { label: t('statusRolledBack'), className: 'border-white/10 text-muted-foreground bg-white/[0.02]' },
  };

  function reset() {
    setStep('list');
    setFile(null);
    setFileError(null);
    setSelectedBatchId(null);
    setSuccessBatch(null);
    uploadOfx.reset();
    rollbackImport.reset();
  }

  function handleClose() {
    setIsOpen(false);
    reset();
  }

  function handleOpen() {
    setIsOpen(true);
    reset();
  }

  async function handleUpload() {
    if (!file) {
      setFileError(t('selectFileError'));
      return;
    }
    setFileError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const batch = await uploadOfx.mutateAsync(formData);
      setSelectedBatchId(batch.id);
      setStep('review');
    } catch {
      // error already signaled via mutation state
    }
  }

  async function handleRollback(id: string) {
    try {
      await rollbackImport.mutateAsync(id);
    } catch {
      // error already signaled via mutation state
    }
  }

  const batches = batchesQuery.data ?? [];
  const dateLocale = locale === 'pt-BR' ? 'pt-BR' : locale === 'es' ? 'es' : 'en-US';

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2 rounded-xl border-white/10 hover:bg-white/5"
        onClick={handleOpen}
      >
        <Upload className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('button')}</span>
      </Button>

      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent>
          <DrawerHeader
            onClose={handleClose}
            actions={
              step !== 'list' && step !== 'success' ? (
                <button
                  type="button"
                  onClick={() => setStep('list')}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : undefined
            }
          >
            <SheetTitle className="text-2xl font-bold font-display text-primary">
              {step === 'review' ? t('reviewTitle') : step === 'success' ? t('successTitle') : t('listTitle')}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {step === 'list' && t('listDescription')}
              {step === 'upload' && t('uploadDescription')}
              {step === 'review' && t('reviewDescription')}
              {step === 'success' && t('successDescription')}
            </p>
          </DrawerHeader>

          {step === 'list' && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {batchesQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 w-full bg-card/50 animate-pulse rounded-2xl border border-white/5" />
                  ))
                ) : batchesQuery.isError ? (
                  <ServerErrorState onRetry={batchesQuery.refetch} />
                ) : batches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-muted/20 mb-4">
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-base font-medium">{t('noImports')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('importToStart')}</p>
                  </div>
                ) : (
                  batches.map((batch: ImportBatch) => {
                    const statusCfg = STATUS_LABEL[batch.status];
                    return (
                      <div
                        key={batch.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/5 bg-card/40 p-3"
                      >
                        <div className="p-2.5 rounded-xl bg-white/5">
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{batch.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(batch.createdAt), 'dd MMM yy, HH:mm')}
                            </span>
                            <Badge variant="outline" className={`h-5 px-1.5 text-[9px] font-bold ${statusCfg.className}`}>
                              {statusCfg.label}
                            </Badge>
                          </div>
                        </div>
                        {batch.status === 'PENDING_REVIEW' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-white/10 hover:bg-white/5 shrink-0"
                            onClick={() => { setSelectedBatchId(batch.id); setStep('review'); }}
                          >
                            {t('review')}
                          </Button>
                        )}
                        {batch.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-white/10 hover:bg-white/5 shrink-0"
                            onClick={() => handleRollback(batch.id)}
                            disabled={rollbackImport.isPending}
                          >
                            {t('undo')}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <DrawerFooter>
                <Button
                  className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
                  onClick={() => setStep('upload')}
                >
                  {t('newImport')}
                </Button>
              </DrawerFooter>
            </>
          )}

          {step === 'upload' && (
            <>
              <div className="flex-1 px-6 py-4 space-y-4">
                <OfxFileDropzone
                  file={file}
                  onChange={(value) => { setFile(value); setFileError(null); }}
                  onValidationError={setFileError}
                  error={fileError ?? (uploadOfx.isError ? (uploadOfx.error as Error)?.message : null)}
                />
              </div>

              <DrawerFooter>
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
                  onClick={() => setStep('list')}
                  disabled={uploadOfx.isPending}
                >
                  {t('back')}
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
                  onClick={handleUpload}
                  disabled={uploadOfx.isPending || !file}
                >
                  {uploadOfx.isPending ? t('sending') : t('sendFile')}
                </Button>
              </DrawerFooter>
            </>
          )}

          {step === 'review' && selectedBatchId && (
            <ImportReviewStep
              batchId={selectedBatchId}
              onConfirmed={(batch) => { setSuccessBatch(batch); setStep('success'); }}
              onCanceled={() => setStep('list')}
              onBack={() => setStep('list')}
            />
          )}

          {step === 'success' && (
            <>
              <div className="flex-1 px-6 py-4 flex flex-col items-center justify-center text-center gap-4">
                <div className="p-4 rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">
                    {t('transactionsImported', { count: successBatch?.importedCount ?? 0 })}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t('entriesAppear')}</p>
                </div>
              </div>

              <DrawerFooter>
                {successBatch && (
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
                    onClick={() => handleRollback(successBatch.id)}
                    disabled={rollbackImport.isPending}
                  >
                    {rollbackImport.isPending ? t('undoing') : t('undoNow')}
                  </Button>
                )}
                <Button
                  className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
                  onClick={handleClose}
                >
                  {t('finish')}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Sheet>
    </>
  );
}
