// Notification API module (PKG_09 / UC019).
import client from './client';

export const notificationApi = {
  list: () => client.get('/notifications').then((r) => r.data),
  markRead: (id) => client.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => client.patch('/notifications/read-all').then((r) => r.data),
};
