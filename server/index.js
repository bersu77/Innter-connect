import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import internshipRoutes from './routes/internshipRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import placementRoutes from './routes/placementRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'InternConnect API is running' });
});

// Static file serving for uploads (local storage; S3 in Phase 14)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/placements', placementRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
