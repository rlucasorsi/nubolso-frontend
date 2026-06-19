import { HttpClient } from '@/network/http-client';
import type {
  Goal,
  GoalContribution,
  GetAllGoalsResponse,
  CreateGoalRequest,
  CreateGoalResponse,
  UpdateGoalRequest,
  UpdateGoalResponse,
  DeleteGoalRequest,
  AddGoalContributionRequest,
  AddGoalContributionResponse,
  ListGoalContributionsRequest,
  ListGoalContributionsResponse,
} from '../model/api/goal';

interface GoalContributionApi {
  id: string;
  amount: number;
  date: string;
  description: string;
}

interface GoalApi {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  createdAt: string;
  contributions: GoalContributionApi[];
}

function mapContribution(contribution: GoalContributionApi): GoalContribution {
  return {
    id: contribution.id,
    amount: contribution.amount,
    description: contribution.description,
    date: contribution.date.split('T')[0],
  };
}

function mapGoal(goal: GoalApi): Goal {
  return {
    ...goal,
    color: goal.color as Goal['color'],
    deadline: goal.deadline.split('T')[0],
    createdAt: goal.createdAt.split('T')[0],
    contributions: (goal.contributions ?? []).map(mapContribution),
  };
}

export const goalsService = {
  getAll: async () => {
    const data = await HttpClient.get<GoalApi[], undefined>('/goals');
    return data.map(mapGoal) as GetAllGoalsResponse;
  },

  create: async (params: CreateGoalRequest) => {
    const data = await HttpClient.post<GoalApi, CreateGoalRequest>('/goals', params);
    return mapGoal(data) as CreateGoalResponse;
  },

  update: async (params: UpdateGoalRequest) => {
    const { id, ...rest } = params;
    const data = await HttpClient.patch<GoalApi, Omit<UpdateGoalRequest, 'id'>>(`/goals/${id}`, rest);
    return mapGoal(data) as UpdateGoalResponse;
  },

  delete: async (params: DeleteGoalRequest) => {
    return HttpClient.delete(`/goals/${params.id}`);
  },

  addContribution: async (params: AddGoalContributionRequest) => {
    const { goalId, ...rest } = params;
    const data = await HttpClient.post<GoalApi, Omit<AddGoalContributionRequest, 'goalId'>>(
      `/goals/${goalId}/contributions`,
      rest,
    );
    return mapGoal(data) as AddGoalContributionResponse;
  },

  listContributions: async (params: ListGoalContributionsRequest) => {
    const { goalId, page, limit } = params;
    const data = await HttpClient.get<
      { data: GoalContributionApi[]; page: number; limit: number; total: number; hasMore: boolean },
      { page: number; limit: number }
    >(`/goals/${goalId}/contributions`, { params: { page, limit } });

    return {
      ...data,
      data: data.data.map(mapContribution),
    } as ListGoalContributionsResponse;
  },
};
