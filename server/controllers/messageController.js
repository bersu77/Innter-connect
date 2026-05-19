import Message from '../models/Message.js';
import Placement from '../models/Placement.js';
import Student from '../models/Student.js';
import { notify } from '../services/notification.js';

// Chat thread per placement — the intern and their supervisor.
// Resolves the placement and verifies the caller is a participant.
async function loadThread(req) {
  const placement = await Placement.findById(req.params.id);
  if (!placement) return { error: 404, message: 'Placement not found' };

  if (req.user.userType === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || String(placement.studentId) !== String(student._id)) {
      return { error: 403, message: 'This is not your placement thread' };
    }
    return { placement, role: 'student' };
  }
  if (String(placement.supervisorId) !== String(req.user._id)) {
    return { error: 403, message: 'This is not your placement thread' };
  }
  return { placement, role: 'supervisor' };
}

// @route GET /api/placements/:id/messages
export const listMessages = async (req, res, next) => {
  try {
    const { placement, role, error, message } = await loadThread(req);
    if (error) return res.status(error).json({ success: false, message });
    // A "fresh" reassignment moves engagementStartedAt forward, hiding the
    // previous supervisor's conversation from the active thread.
    const threadStart = placement.engagementStartedAt || placement.createdAt;
    const messages = await Message.find({
      placementId: placement._id,
      createdAt: { $gte: threadStart },
    })
      .populate('senderId', 'firstName lastName username userType roles')
      .sort('createdAt');
    res.json({ success: true, messages, role });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/placements/:id/messages
export const sendMessage = async (req, res, next) => {
  try {
    const { placement, role, error, message } = await loadThread(req);
    if (error) return res.status(error).json({ success: false, message });
    const body = String(req.body.body || '').trim();
    if (!body) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const created = await Message.create({
      placementId: placement._id,
      senderId: req.user._id,
      senderRole: role,
      body,
    });

    // Notify the other participant.
    let recipientId = placement.supervisorId;
    if (role === 'supervisor') {
      const student = await Student.findById(placement.studentId);
      recipientId = student?.userId;
    }
    if (recipientId) {
      await notify({
        userId: recipientId,
        type: 'message',
        title: 'New message',
        message: `${req.user.firstName} ${req.user.lastName} sent you a message.`,
        relatedEntity: { type: 'Placement', id: placement._id },
      });
    }

    const populated = await created.populate(
      'senderId',
      'firstName lastName username userType roles',
    );
    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    next(err);
  }
};
