// Task & assessment API modules (PKG_05 / UC010, UC011).
import client from './client';

export const taskApi = {
  list: () => client.get('/tasks').then((r) => r.data),
  create: (data) => client.post('/tasks', data).then((r) => r.data),
  updateProgress: (id, status, progressNote) =>
    client.patch(`/tasks/${id}/progress`, { status, progressNote }).then((r) => r.data),
};

export const assessmentApi = {
  list: () => client.get('/assessments').then((r) => r.data),
  request: (placementId) => client.post('/assessments', { placementId }).then((r) => r.data),
  submit: (id, data) => client.patch(`/assessments/${id}`, data).then((r) => r.data),
};
