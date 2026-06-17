export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  description: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: 'primary' | 'secondary' | 'tertiary';
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  createdAt: string;
  contributions: GoalContribution[];
}

export type GetAllGoalsResponse = Goal[];

export interface CreateGoalRequest {
  name: string;
  description: string;
  icon: string;
  color: string;
  targetAmount: number;
  savedAmount?: number;
  deadline: string;
}

export type CreateGoalResponse = Goal;

export interface UpdateGoalRequest {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  targetAmount?: number;
  savedAmount?: number;
  deadline?: string;
  contributions?: GoalContribution[];
}

export type UpdateGoalResponse = Goal;

export interface DeleteGoalRequest {
  id: string;
}

export interface AddGoalContributionRequest {
  goalId: string;
  amount: number;
  description?: string;
  date?: string;
}

export type AddGoalContributionResponse = Goal;

export interface ListGoalContributionsRequest {
  goalId: string;
  page: number;
  limit: number;
}

export interface ListGoalContributionsResponse {
  data: GoalContribution[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
