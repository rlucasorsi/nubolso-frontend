export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentBalance: number;
  balanceStartDate: string | null;
}

export type GetMeResponse = UserProfile;

export interface UpdateUserRequest {
  name?: string;
  currentBalance?: number;
  balanceStartDate?: string;
}

export type UpdateUserResponse = UserProfile;
