// Task & assessment API modules (PKG_05 / UC010, UC011).
import client from './client';

export const taskApi = {
  list: () => client.get('/tasks').then((r) => r.data),
  create: (data) => client.post('/tasks', data).then((r) => r.data),
  updateProgress: (id, status, progressNote) =>
    client.patch(`/tasks/${id}/progress`, { status, progressNote }).then((r) => r.data),
  grade: (id, score, feedback) =>
    client.patch(`/tasks/${id}/grade`, { score, feedback }).then((r) => r.data),
  // Student appeals a task grade; supervisor resolves it (optionally re-scoring).
  appeal: (id, reason) => client.post(`/tasks/${id}/appeal`, { reason }).then((r) => r.data),
  resolveAppeal: (id, { response, score, feedback }) =>
    client.patch(`/tasks/${id}/appeal`, { response, score, feedback }).then((r) => r.data),
  // Submit deliverables (document file + link + note) and complete the task.
  submit: (id, { document, link, note }) => {
    const fd = new FormData();
    if (document) fd.append('document', document);
    if (link) fd.append('link', link);
    if (note) fd.append('note', note);
    return client.post(`/tasks/${id}/submit`, fd).then((r) => r.data);
  },
};

export const assessmentApi = {
  list: () => client.get('/assessments').then((r) => r.data),
  request: (placementId) => client.post('/assessments', { placementId }).then((r) => r.data),
  submit: (id, data) => client.patch(`/assessments/${id}`, data).then((r) => r.data),
};
