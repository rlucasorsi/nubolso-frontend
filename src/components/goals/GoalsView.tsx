'use client';

import { useState } from 'react';
import { useGetGoals } from '@/modules/goals/hooks/use-get-goals';
import { ServerErrorState } from '@/components/ui/server-error-state';
import { useCreateGoal } from '@/modules/goals/hooks/use-create-goal';
import { useUpdateGoal } from '@/modules/goals/hooks/use-update-goal';
import { useDeleteGoal } from '@/modules/goals/hooks/use-delete-goal';
import { useAddGoalContribution } from '@/modules/goals/hooks/use-add-goal-contribution';
import type { Goal } from '@/modules/goals/model/api/goal';
import { logger } from '@/lib/logger';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalDetailDrawer } from '@/components/goals/GoalDetailDrawer';
import { CreateGoalDrawer } from '@/components/goals/CreateGoalDrawer';
import { AddFundsDrawer } from '@/components/goals/AddFundsDrawer';
import { GoalsSummary } from '@/components/goals/GoalsSummary';
import { AddButton } from '@/components/ui/add-button';
import { Target } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { usePlan } from '@/modules/billing/hooks/use-plan';
import { UpgradeDrawer } from '@/components/billing/UpgradeDrawer';

export function GoalsView() {
  const t = useTranslations('goalsView');
  const goalsQuery = useGetGoals();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const addContributionMutation = useAddGoalContribution();

  const { isFree, limits } = usePlan();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState<Goal | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const goals = goalsQuery.data ?? [];
  const isLoading = goalsQuery.isLoading;
  const isError = goalsQuery.isError;

  const handleCreateGoal = async (data: {
    name: string;
    description: string;
    icon: string;
    targetAmount: number;
    deadline: string;
  }) => {
    await createGoalMutation.mutateAsync({
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: 'primary',
      targetAmount: data.targetAmount,
      deadline: data.deadline,
    });
    setShowCreateDrawer(false);
  };

  const handleAddFunds = async (goalId: string, amount: number, date: string) => {
    const updatedGoal = await addContributionMutation.mutateAsync({ goalId, amount, date });

    // Refresh goal detail if open
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(updatedGoal);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoalMutation.mutateAsync({ id: goalId });
    setShowDetailDrawer(false);
    setSelectedGoal(null);
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDetailDrawer(true);
  };

  const handleAddFundsFromDetail = (goal: Goal) => {
    setShowDetailDrawer(false);
    setAddFundsGoal(goal);
  };

  // Summary calculations
  const totalPlanned = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const activeGoals = goals.length;
  const nearCompletion = goals.filter((g) => g.savedAmount / g.targetAmount >= 0.85).length;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isFree && (
            <p className="text-xs text-muted-foreground">
              {activeGoals}/{limits.goals} metas
            </p>
          )}
          <AddButton
            onClick={() => {
              if (isFree && activeGoals >= limits.goals) {
                setUpgradeOpen(true);
                return;
              }
              setShowCreateDrawer(true);
            }}
            title={t('addGoalTitle')}
            label={t('addGoal')}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {isError ? (
        <ServerErrorState onRetry={() => goalsQuery.refetch()} />
      ) : isLoading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[124px] bg-card/50 animate-pulse rounded-base border border-white/5"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[280px] bg-card/50 animate-pulse rounded-2xl border border-white/5"
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Summary Cards */}
          <GoalsSummary
            totalPlanned={totalPlanned}
            totalSaved={totalSaved}
            activeGoals={activeGoals}
            nearCompletion={nearCompletion}
          />

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => handleGoalClick(goal)}
                onAddFunds={() => setAddFundsGoal(goal)}
              />
            ))}

            {/* Add New Card */}
            <button
              onClick={() => {
                if (isFree && activeGoals >= limits.goals) {
                  setUpgradeOpen(true);
                  return;
                }
                setShowCreateDrawer(true);
              }}
              className="border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-all cursor-pointer min-h-[280px] group"
            >
              <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <Target className="h-6 w-6" />
              </div>
              <span className="font-medium text-sm">{t('createNew')}</span>
            </button>
          </div>
        </>
      )}

      {/* Drawers */}
      <CreateGoalDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateGoal}
        isLoading={createGoalMutation.isPending}
      />

      <GoalDetailDrawer
        open={showDetailDrawer}
        goal={selectedGoal}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedGoal(null);
        }}
        onAddFunds={handleAddFundsFromDetail}
        onDelete={handleDeleteGoal}
        isDeleting={deleteGoalMutation.isPending}
        onUpdateGoal={async (updatedGoal) => {
          try {
            await updateGoalMutation.mutateAsync({
              id: updatedGoal.id,
              savedAmount: updatedGoal.savedAmount,
              contributions: updatedGoal.contributions,
            });
            setSelectedGoal(updatedGoal);
          } catch (error) {
            logger.error('Failed to update goal contributions', {
              err: error instanceof Error ? error : undefined,
            });
          }
        }}
      />

      <AddFundsDrawer
        open={!!addFundsGoal}
        goal={addFundsGoal}
        onClose={() => setAddFundsGoal(null)}
        onSubmit={handleAddFunds}
        isLoading={addContributionMutation.isPending}
      />

      <UpgradeDrawer
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        featureKey="featureGoals"
      />
    </div>
  );
}
