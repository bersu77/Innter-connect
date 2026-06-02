import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import taskRoutes from './routes/taskRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import errorHandler, { notFound } from './middleware/errorHandler.js';

// Recreate __dirname for ES Modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
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
app.use('/api/tasks', taskRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);

// --- Serve the built React frontend (single Web Service deploy) ---
// server/index.js lives in /server, so the build output is one level up in
// /client/dist. Express serves the static assets, then any non-API GET falls
// through to index.html so React Router can handle client-side routing.
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  // Let unmatched /api/* requests fall through to the JSON 404 handler below.
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// 404 + error handler (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
