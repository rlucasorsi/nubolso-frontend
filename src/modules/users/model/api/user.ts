export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentBalance: number;
  balanceStartDate: string | null;
  greenThreshold: number;
  yellowThreshold: number;
  plan: 'FREE' | 'PRO';
}

export type GetMeResponse = UserProfile;

export interface UpdateUserRequest {
  name?: string;
  currentBalance?: number;
  balanceStartDate?: string;
  greenThreshold?: number;
  yellowThreshold?: number;
}

export type UpdateUserResponse = UserProfile;
