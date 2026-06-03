import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
<<<<<<< Updated upstream
import errorHandler from './middleware/errorHandler.js';
=======
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
import cors from 'cors';

app.use(cors({
  origin: "*", // Or "*" to allow everything for now
  credentials: true
}));
>>>>>>> Stashed changes

const app = express();
const PORT = process.env.PORT || 8000;

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

// Routes
app.use('/api/auth', authRoutes);
<<<<<<< Updated upstream
=======
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

app.get('*', (req, res, next) => {
  // Let unmatched /api/* requests fall through to the JSON 404 handler below.
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});
>>>>>>> Stashed changes

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
