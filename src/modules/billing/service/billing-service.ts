import { HttpClient } from '@/network/http-client';

export const billingService = {
  createCheckoutSession: async (): Promise<string> => {
    const res = await HttpClient.post<{ url: string }, undefined>('/billing/checkout');
    return res.url;
  },

  createPortalSession: async (): Promise<string> => {
    const res = await HttpClient.post<{ url: string }, undefined>('/billing/portal');
    return res.url;
  },
};
