// Audit & compliance API module (PKG_08 / UC014, FR14).
import client from './client';

export const auditApi = {
  logs: (params) => client.get('/audit/logs', { params }).then((r) => r.data),
  stats: () => client.get('/audit/stats').then((r) => r.data),
};
