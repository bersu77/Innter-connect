import Notification from '../models/Notification.js';

// Notification service (PKG_09 / PDF §3.3.4.7) — in-app notification creation.
// Email/SMS channels are delivered in Phase 14; this scaffolds the in-app channel.
export async function notify({ userId, type, title, message, relatedEntity, link }) {
  try {
    return await Notification.create({ userId, type, title, message, relatedEntity, link });
  } catch (err) {
    console.error('Notification create failed:', err.message);
    return null;
  }
}

// Fan-out the same notification to many users.
export async function notifyMany(userIds, payload) {
  return Promise.all((userIds || []).filter(Boolean).map((userId) => notify({ ...payload, userId })));
}
