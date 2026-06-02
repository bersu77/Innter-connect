// Application API module (PKG_05 / UC003, UC004, UC007, UC008, UC016, UC017).
import client from './client';

export const applicationApi = {
  list: (params) => client.get('/applications', { params }).then((r) => r.data),
  get: (id) => client.get(`/applications/${id}`).then((r) => r.data),
  // selectedItems: profile-item references [{ kind, index }] to attach;
  // files: manually uploaded files to attach alongside.
  apply: (internshipId, { coverLetter = '', universityId, selectedItems = [], files = [] } = {}) => {
    const fd = new FormData();
    fd.append('internshipId', internshipId);
    fd.append('coverLetter', coverLetter);
    if (universityId) fd.append('universityId', universityId);
    fd.append('selectedItems', JSON.stringify(selectedItems));
    files.forEach((f) => fd.append('attachments', f));
    return client.post('/applications', fd).then((r) => r.data);
  },
  updateStatus: (id, status, note) =>
    client.patch(`/applications/${id}/status`, { status, note }).then((r) => r.data),
  // University verifies (or rejects) the student behind an application.
  verify: (id, decision, note) =>
    client.patch(`/applications/${id}/verify`, { decision, note }).then((r) => r.data),
  withdraw: (id) => client.patch(`/applications/${id}/withdraw`).then((r) => r.data),
  respondOffer: (id, decision) =>
    client.patch(`/applications/${id}/respond-offer`, { decision }).then((r) => r.data),
};
