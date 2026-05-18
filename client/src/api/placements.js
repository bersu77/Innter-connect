// Placement API module (PKG_05 / UC009, UC018).
import client from './client';

export const placementApi = {
  list: () => client.get('/placements').then((r) => r.data),
  assignSupervisor: (id, supervisorId) =>
    client.patch(`/placements/${id}/supervisor`, { supervisorId }).then((r) => r.data),
  supervisors: () => client.get('/companies/supervisors').then((r) => r.data),
  submitReport: (id, file) => {
    const fd = new FormData();
    fd.append('report', file);
    return client.post(`/placements/${id}/report`, fd).then((r) => r.data);
  },
  confirmCompletion: (id) =>
    client.patch(`/placements/${id}/confirm-completion`).then((r) => r.data),
  validateCompletion: (id) =>
    client.patch(`/placements/${id}/validate-completion`).then((r) => r.data),
};
