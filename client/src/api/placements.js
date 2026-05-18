// Placement API module (PKG_05 / UC009).
import client from './client';

export const placementApi = {
  list: () => client.get('/placements').then((r) => r.data),
  assignSupervisor: (id, supervisorId) =>
    client.patch(`/placements/${id}/supervisor`, { supervisorId }).then((r) => r.data),
  supervisors: () => client.get('/companies/supervisors').then((r) => r.data),
};
