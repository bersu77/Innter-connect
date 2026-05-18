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
};

export const companyApi = {
  getProfile: () => client.get('/companies/me').then((r) => r.data),
  updateProfile: (data) => client.put('/companies/me', data).then((r) => r.data),
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
