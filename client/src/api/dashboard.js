// Dashboard summary API module.
import client from './client';

export const dashboardApi = {
  get: () => client.get('/dashboard').then((r) => r.data),
};
