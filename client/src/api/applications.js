// Application API module (PKG_05 / UC003, UC004, UC007, UC008, UC016, UC017).
import client from './client';

export const applicationApi = {
  list: (params) => client.get('/applications', { params }).then((r) => r.data),
  get: (id) => client.get(`/applications/${id}`).then((r) => r.data),
  apply: (internshipId, coverLetter) =>
    client.post('/applications', { internshipId, coverLetter }).then((r) => r.data),
  updateStatus: (id, status, note) =>
    client.patch(`/applications/${id}/status`, { status, note }).then((r) => r.data),
  withdraw: (id) => client.patch(`/applications/${id}/withdraw`).then((r) => r.data),
  respondOffer: (id, decision) =>
    client.patch(`/applications/${id}/respond-offer`, { decision }).then((r) => r.data),
};
