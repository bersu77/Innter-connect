// Account API — change own username / password.
import client from './client';

export const accountApi = {
  updateCredentials: (data) => client.patch('/auth/credentials', data).then((r) => r.data),
};
