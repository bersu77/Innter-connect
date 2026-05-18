// Verification & appeals API (PKG_08 / verification appeals workflow).
import client from './client';

export const verificationApi = {
  mine: () => client.get('/verifications/mine').then((r) => r.data),
  submitAppeal: (verificationId, reason) =>
    client.post(`/verifications/${verificationId}/appeal`, { reason }).then((r) => r.data),
  listAppeals: () => client.get('/verifications/appeals').then((r) => r.data),
  decideAppeal: (id, decision) =>
    client.patch(`/verifications/appeals/${id}`, { decision }).then((r) => r.data),
};
