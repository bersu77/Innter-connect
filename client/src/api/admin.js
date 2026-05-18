// Admin API module (UC012, FR13).
import client from './client';

export const adminApi = {
  getStats: () => client.get('/admin/stats').then((r) => r.data),
  listUsers: (params) => client.get('/admin/users', { params }).then((r) => r.data),
  updateUserStatus: (id, status) =>
    client.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data),
  listOrganizations: () => client.get('/admin/organizations').then((r) => r.data),
  verifyOrganization: (type, id, decision, remarks) =>
    client
      .patch(`/admin/organizations/${type}/${id}/verify`, { decision, remarks })
      .then((r) => r.data),
};
