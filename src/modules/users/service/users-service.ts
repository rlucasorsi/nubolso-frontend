import { HttpClient } from '@/network/http-client';
import type { GetMeResponse, UpdateUserRequest, UpdateUserResponse } from '../model/api/user';

export const usersService = {
  getMe: async () => {
    return HttpClient.get<GetMeResponse, undefined>('/users/me');
  },

  updateMe: async (params: UpdateUserRequest) => {
    return HttpClient.patch<UpdateUserResponse, UpdateUserRequest>('/users/me', params);
  },
};
