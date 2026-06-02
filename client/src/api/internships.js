// Internship & invitation API modules (PKG_04 / UC005, UC006, UC015, FR3, FR11).
import client from './client';

export const internshipApi = {
  list: (params) => client.get('/internships', { params }).then((r) => r.data),
  listMine: () => client.get('/internships/mine').then((r) => r.data),
  get: (id) => client.get(`/internships/${id}`).then((r) => r.data),
  create: (data) => client.post('/internships', data).then((r) => r.data),
  update: (id, data) => client.put(`/internships/${id}`, data).then((r) => r.data),
  updateStatus: (id, status) =>
    client.patch(`/internships/${id}/status`, { status }).then((r) => r.data),
};

export const invitationApi = {
  list: () => client.get('/invitations').then((r) => r.data),
  send: (companyId, message) =>
    client.post('/invitations', { companyId, message }).then((r) => r.data),
  respond: (id, decision) =>
    client.patch(`/invitations/${id}/respond`, { decision }).then((r) => r.data),
};

export const companySearchApi = {
  list: (params) => client.get('/companies', { params }).then((r) => r.data),
};
