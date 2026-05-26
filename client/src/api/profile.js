// Profile API modules (PKG_03, PKG_06).
import client from './client';

export const studentApi = {
  getProfile: () => client.get('/students/me').then((r) => r.data),
  updateProfile: (data) => client.put('/students/me', data).then((r) => r.data),
  uploadCv: (file) => {
    const fd = new FormData();
    fd.append('cv', file);
    return client.post('/students/me/cv', fd).then((r) => r.data);
  },
  // Portfolio item — a titled link or an uploaded image/file.
  addPortfolioItem: ({ title, description, link, file }) => {
    const fd = new FormData();
    fd.append('title', title);
    if (description) fd.append('description', description);
    if (link) fd.append('link', link);
    if (file) fd.append('file', file);
    return client.post('/students/me/portfolio', fd).then((r) => r.data);
  },
  removePortfolioItem: (index) =>
    client.delete(`/students/me/portfolio/${index}`).then((r) => r.data),
  // Academic documents — always file-backed. Each has a category
  // (transcript, recommendation_letter, certificate, id_card, …) + a label.
  addAcademicDocument: ({ file, category, name }) => {
    const fd = new FormData();
    fd.append('file', file);
    if (category) fd.append('category', category);
    if (name) fd.append('name', name);
    return client.post('/students/me/documents', fd).then((r) => r.data);
  },
  removeAcademicDocument: (index) =>
    client.delete(`/students/me/documents/${index}`).then((r) => r.data),
};

export const companyApi = {
  getProfile: () => client.get('/companies/me').then((r) => r.data),
  updateProfile: (data) => client.put('/companies/me', data).then((r) => r.data),
  listSupervisors: () => client.get('/companies/supervisors').then((r) => r.data),
  createSupervisor: (data) => client.post('/companies/supervisors', data).then((r) => r.data),
};

export const universityApi = {
  getProfile: () => client.get('/universities/me').then((r) => r.data),
  updateProfile: (data) => client.put('/universities/me', data).then((r) => r.data),
  list: () => client.get('/universities').then((r) => r.data),
  listStudents: () => client.get('/universities/students').then((r) => r.data),
  verifyStudent: (studentId, decision, remarks) =>
    client
      .patch(`/universities/students/${studentId}/verify`, { decision, remarks })
      .then((r) => r.data),
};
