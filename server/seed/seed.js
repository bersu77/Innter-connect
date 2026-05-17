import 'dotenv/config';
import mongoose from 'mongoose';
import {
  User,
  Student,
  University,
  Company,
  Internship,
  Application,
  Placement,
  Verification,
  VerificationAppeal,
  AuditLog,
  Notification,
  Task,
  Assessment,
  Report,
} from '../models/index.js';

// Seed script — populates a reproducible demo dataset for development & testing.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/internconnect';
const PASSWORD = 'Password123!';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    University.deleteMany({}),
    Company.deleteMany({}),
    Internship.deleteMany({}),
    Application.deleteMany({}),
    Placement.deleteMany({}),
    Verification.deleteMany({}),
    VerificationAppeal.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
    Task.deleteMany({}),
    Assessment.deleteMany({}),
    Report.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // ── Admin ──
  const admin = await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@internconnect.et',
    password: PASSWORD,
    userType: 'admin',
    roles: ['auditor'],
    verificationStatus: 'verified',
    profileComplete: true,
  });

  // ── University ──
  const uniUser = await User.create({
    firstName: 'Selam',
    lastName: 'Bekele',
    email: 'coordinator@aau.edu.et',
    password: PASSWORD,
    userType: 'university',
    verificationStatus: 'verified',
    profileComplete: true,
  });
  const aau = await University.create({
    userId: uniUser._id,
    name: 'Addis Ababa University',
    email: 'coordinator@aau.edu.et',
    domain: 'aau.edu.et',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    accreditationCode: 'ET-AAU-001',
    verified: true,
    verificationDate: new Date(),
    verifiedBy: admin._id,
    departments: ['Computer Science', 'Software Engineering', 'Information Systems'],
    admins: [uniUser._id],
    status: 'active',
  });

  // ── Company + supervisor ──
  const companyUser = await User.create({
    firstName: 'Hanna',
    lastName: 'Tesfaye',
    email: 'hr@zemen-tech.et',
    password: PASSWORD,
    userType: 'company',
    verificationStatus: 'verified',
    profileComplete: true,
  });
  const supervisorUser = await User.create({
    firstName: 'Daniel',
    lastName: 'Girma',
    email: 'daniel@zemen-tech.et',
    password: PASSWORD,
    userType: 'company',
    roles: ['supervisor'],
    verificationStatus: 'verified',
    profileComplete: true,
  });
  const company = await Company.create({
    userId: companyUser._id,
    name: 'Zemen Technologies',
    email: 'hr@zemen-tech.et',
    industry: 'Software',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    employees: '51-200',
    founded: 2015,
    website: 'https://zemen-tech.et',
    description: 'A leading Ethiopian software company building fintech products.',
    verified: true,
    verificationDate: new Date(),
    verifiedBy: admin._id,
    recruiters: [companyUser._id],
    status: 'active',
  });

  // ── Students ──
  const dawitUser = await User.create({
    firstName: 'Dawit',
    lastName: 'Workineh',
    email: 'dawit@aau.edu.et',
    password: PASSWORD,
    userType: 'student',
    verificationStatus: 'verified',
    profileComplete: true,
  });
  const dawit = await Student.create({
    userId: dawitUser._id,
    universityId: aau._id,
    studentId: 'UGR/4403/15',
    enrollmentYear: 2022,
    graduationYear: 2026,
    major: 'Computer Science',
    gpa: 3.7,
    skills: ['JavaScript', 'React', 'Node.js'],
    interests: ['Web Development', 'UI/UX'],
    languages: ['Amharic', 'English'],
    verificationStatus: 'verified',
    universityVerifiedAt: new Date(),
    verifiedBy: uniUser._id,
  });

  const alexUser = await User.create({
    firstName: 'Alex',
    lastName: 'Mengistu',
    email: 'alex@aau.edu.et',
    password: PASSWORD,
    userType: 'student',
    verificationStatus: 'pending',
    profileComplete: true,
  });
  const alex = await Student.create({
    userId: alexUser._id,
    universityId: aau._id,
    studentId: 'UGR/4143/15',
    enrollmentYear: 2022,
    graduationYear: 2026,
    major: 'Software Engineering',
    gpa: 3.4,
    skills: ['Python', 'Django'],
    interests: ['Data Science'],
    languages: ['Amharic', 'English'],
    verificationStatus: 'pending',
  });

  // ── Internships ──
  const frontend = await Internship.create({
    companyId: company._id,
    title: 'Frontend Developer Intern',
    description: 'Join our React team building modern user interfaces for fintech products.',
    locations: ['Addis Ababa'],
    requirements: {
      minGPA: 3.0,
      skills: ['React', 'JavaScript'],
      majors: ['Computer Science', 'Software Engineering'],
    },
    position: { type: 'onsite', duration: '3 months', paid: true, stipend: 8000 },
    applicationDeadline: new Date(Date.now() + 30 * 864e5),
    postedDate: new Date(),
    totalPositions: 2,
    tags: ['frontend', 'react', 'javascript'],
    status: 'active',
    createdBy: companyUser._id,
  });
  const backend = await Internship.create({
    companyId: company._id,
    title: 'Backend Developer Intern',
    description: 'Build and maintain REST APIs with Node.js, Express, and MongoDB.',
    locations: ['Addis Ababa', 'Remote'],
    requirements: { minGPA: 3.0, skills: ['Node.js'], majors: ['Computer Science'] },
    position: { type: 'hybrid', duration: '4 months', paid: true, stipend: 9000 },
    applicationDeadline: new Date(Date.now() + 45 * 864e5),
    postedDate: new Date(),
    totalPositions: 1,
    tags: ['backend', 'nodejs', 'mongodb'],
    status: 'active',
    createdBy: companyUser._id,
  });
  await Internship.create({
    companyId: company._id,
    title: 'Data Analyst Intern',
    description: 'Analyse product usage data and build dashboards.',
    locations: ['Addis Ababa'],
    position: { type: 'onsite', duration: '3 months', paid: false },
    status: 'draft',
    createdBy: companyUser._id,
  });

  // ── A sample application from Dawit ──
  const application = await Application.create({
    studentId: dawit._id,
    internshipId: frontend._id,
    companyId: company._id,
    universityId: aau._id,
    coverLetter: 'I am excited to apply for the Frontend Developer Intern position.',
    status: 'submitted',
    submittedAt: new Date(),
    statusHistory: [{ status: 'submitted', changedBy: dawitUser._id }],
  });
  frontend.applications.push(application._id);
  await frontend.save();

  // ── A welcome notification ──
  await Notification.create({
    userId: dawitUser._id,
    type: 'system',
    title: 'Welcome to InternConnect',
    message: 'Your account is ready. Browse internships and start applying.',
  });

  console.log('\nSeed complete:');
  console.log(`  Users:         ${await User.countDocuments()}`);
  console.log(`  Students:      ${await Student.countDocuments()}`);
  console.log(`  Universities:  ${await University.countDocuments()}`);
  console.log(`  Companies:     ${await Company.countDocuments()}`);
  console.log(`  Internships:   ${await Internship.countDocuments()}`);
  console.log(`  Applications:  ${await Application.countDocuments()}`);
  console.log(`  Notifications: ${await Notification.countDocuments()}`);
  console.log('\nDemo logins (password for all: Password123!):');
  console.log('  admin@internconnect.et       — admin');
  console.log('  coordinator@aau.edu.et       — university');
  console.log('  hr@zemen-tech.et             — company');
  console.log('  daniel@zemen-tech.et         — company (supervisor)');
  console.log('  dawit@aau.edu.et             — student (verified)');
  console.log('  alex@aau.edu.et              — student (pending)');

  await mongoose.disconnect();
  console.log('\nDisconnected.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
