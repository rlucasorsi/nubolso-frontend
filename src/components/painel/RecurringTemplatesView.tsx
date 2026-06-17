'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RotateCw, Pencil, Trash2, Loader2 } from 'lucide-react';
import { ServerErrorState } from '@/components/ui/server-error-state';
import { formatCurrency } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { TYPE_CONFIG } from '@/components/painel/config';
import { RecurringTemplateDrawer } from '@/components/painel/RecurringTemplateDrawer';
import { useGetRecurringTemplates } from '@/modules/recurring-templates/hooks/use-get-recurring-templates';
import { useDeleteRecurringTemplate } from '@/modules/recurring-templates/hooks/use-delete-recurring-template';
import { useUpdateRecurringTemplate } from '@/modules/recurring-templates/hooks/use-update-recurring-template';
import { RecurringTemplate } from '@/modules/recurring-templates/service/recurring-templates-service';

export function RecurringTemplatesView() {
  const { data: recurringTemplates, isLoading, isError, refetch } = useGetRecurringTemplates();
  const deactivateTemplateMutation = useDeleteRecurringTemplate();
  const reactivateTemplateMutation = useUpdateRecurringTemplate();

  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | undefined>(undefined);
  const [deactivateTemplateId, setDeactivateTemplateId] = useState<string | null>(null);

  const handleNewTemplate = () => {
    setEditingTemplate(undefined);
    setTemplateDrawerOpen(true);
  };

  const handleEditTemplate = (template: RecurringTemplate) => {
    setEditingTemplate(template);
    setTemplateDrawerOpen(true);
  };

  const handleDeactivateTemplate = () => {
    if (deactivateTemplateId) {
      deactivateTemplateMutation.mutate({ id: deactivateTemplateId });
      setDeactivateTemplateId(null);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold font-display">Contas Recorrentes</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Água, luz, condomínio e outras contas que se repetem todo mês com um valor estimado.
          </p>
        </div>
        <AddButton onClick={handleNewTemplate} title="Nova conta recorrente" label="Adicionar" />
      </div>

      <div className="space-y-2">
        {isError ? (
          <ServerErrorState onRetry={refetch} />
        ) : isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[68px] w-full bg-card/50 animate-pulse rounded-2xl border border-white/5" />
          ))
        ) : !recurringTemplates || recurringTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma conta recorrente cadastrada. Use o botão acima para adicionar água, luz, condomínio, etc.
          </p>
        ) : (
          recurringTemplates.map((template) => {
            const cfg = TYPE_CONFIG[template.type.toLowerCase() as keyof typeof TYPE_CONFIG];
            const isDeactivating =
              deactivateTemplateMutation.isPending && deactivateTemplateMutation.variables?.id === template.id;
            const isReactivating =
              reactivateTemplateMutation.isPending && reactivateTemplateMutation.variables?.id === template.id;
            return (
              <div
                key={template.id}
                className={cn(
                  "flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5",
                  !template.isActive && "opacity-50",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("p-2 rounded-xl shrink-0", cfg.bg)}>
                    {cfg.icon('sm')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{template.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Dia {template.dayOfMonth} · {formatCurrency(template.estimatedAmount)}
                      {!template.isActive && ' · Inativo'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {template.isActive ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeactivateTemplateId(template.id)}
                      disabled={isDeactivating}
                      title="Desativar"
                    >
                      {isDeactivating ? (
                        <Loader2 className="h-4 w-4 text-red-500/60 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500/60" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => reactivateTemplateMutation.mutate({ id: template.id, isActive: true })}
                      disabled={isReactivating}
                      title="Reativar"
                    >
                      {isReactivating ? (
                        <Loader2 className="h-4 w-4 text-emerald-500/60 animate-spin" />
                      ) : (
                        <RotateCw className="h-4 w-4 text-emerald-500/60" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <RecurringTemplateDrawer
        open={templateDrawerOpen}
        onOpenChange={setTemplateDrawerOpen}
        template={editingTemplate}
      />

      <AlertDialog open={!!deactivateTemplateId} onOpenChange={(open) => !open && setDeactivateTemplateId(null)}>
        <AlertDialogContent className="bg-[#1c1a24] border-white/10 rounded-[2rem] p-8 max-w-[400px]">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center mx-auto mb-2 text-red-500">
              <Trash2 className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-black font-display text-white text-center">
              Desativar Conta Recorrente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-center text-sm font-medium">
              Ela deixará de gerar novas estimativas mensais. Lançamentos já efetivados continuam no histórico e você pode reativá-la depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel className="flex-1 h-12 rounded-2xl bg-white/5 border-none text-white hover:bg-white/10 transition-all font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateTemplate}
              className="flex-1 h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all font-bold shadow-lg shadow-red-500/20"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
