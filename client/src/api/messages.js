// Chat / messaging API — a thread lives on a placement (intern ↔ supervisor).
import client from './client';

export const messageApi = {
  list: (placementId) =>
    client.get(`/placements/${placementId}/messages`).then((r) => r.data),
  send: (placementId, body) =>
    client.post(`/placements/${placementId}/messages`, { body }).then((r) => r.data),
};
