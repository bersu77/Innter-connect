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
  Invitation,
  Message,
} from '../models/index.js';

// Seed script — populates a rich, reproducible demo dataset.
// Every collection gets at least 5 records and each role sees a well-filled workspace.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/internconnect';
const PW = 'Password123!';
const days = (n) => new Date(Date.now() + n * 86400000);
const ago = (n) => new Date(Date.now() - n * 86400000);
const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

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
    Invitation.deleteMany({}),
    Message.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // Reconcile Task indexes: the task number is now unique per student, not
  // globally — drop any stale global-unique index left by an earlier schema.
  await Task.syncIndexes();

  // ── Admin ──
  const admin = await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@internconnect.et',
    password: PW,
    userType: 'admin',
    roles: ['auditor'],
    verificationStatus: 'verified',
    profileComplete: true,
  });

  // ── Universities (Addis Ababa University is index 0) ──
  const UNI = [
    ['Addis Ababa University', 'Addis Ababa', 'aau.edu.et', 'ET-AAU-001', 'coordinator@aau.edu.et', 'Selam', 'Bekele'],
    ['Adama Science and Technology University', 'Adama', 'astu.edu.et', 'ET-ASTU-002', 'coordinator@astu.edu.et', 'Tariku', 'Lemma'],
    ['Bahir Dar University', 'Bahir Dar', 'bdu.edu.et', 'ET-BDU-003', 'coordinator@bdu.edu.et', 'Marta', 'Alemu'],
    ['Hawassa University', 'Hawassa', 'hu.edu.et', 'ET-HU-004', 'coordinator@hu.edu.et', 'Yonas', 'Desta'],
    ['Jimma University', 'Jimma', 'ju.edu.et', 'ET-JU-005', 'coordinator@ju.edu.et', 'Hewan', 'Fikru'],
  ];
  const universities = [];
  for (const [name, city, domain, code, email, first, last] of UNI) {
    const coord = await User.create({
      firstName: first, lastName: last, email, password: PW,
      userType: 'university', verificationStatus: 'verified', profileComplete: true,
    });
    const uni = await University.create({
      userId: coord._id, name, email, domain, country: 'Ethiopia', city,
      accreditationCode: code, verified: true, verificationDate: ago(60), verifiedBy: admin._id,
      departments: ['Computer Science', 'Software Engineering', 'Information Systems'],
      admins: [coord._id], status: 'active',
    });
    universities.push({ uni, coord });
  }

  // ── Companies (Zemen Technologies is index 0; its supervisor is created first) ──
  const CO = [
    ['Zemen Technologies', 'Software', 'Addis Ababa', 'hr@zemen-tech.et', 'Hanna', 'Tesfaye', 'daniel@zemen-tech.et', 'Daniel', 'Girma'],
    ['Dashen Software', 'Software', 'Addis Ababa', 'hr@dashen.et', 'Kbrom', 'Haile', 'supervisor@dashen.et', 'Sara', 'Mekonnen'],
    ['Habesha Cloud', 'Cloud Services', 'Addis Ababa', 'hr@habesha-cloud.et', 'Nahom', 'Tadesse', 'supervisor@habesha-cloud.et', 'Liya', 'Getachew'],
    ['Abay Digital', 'Fintech', 'Bahir Dar', 'hr@abay-digital.et', 'Bereket', 'Solomon', 'supervisor@abay-digital.et', 'Eden', 'Worku'],
    ['Sheba Analytics', 'Data & AI', 'Hawassa', 'hr@sheba-analytics.et', 'Robel', 'Negash', 'supervisor@sheba-analytics.et', 'Helen', 'Abebe'],
  ];
  const companies = [];
  for (let i = 0; i < CO.length; i += 1) {
    const [name, industry, city, mEmail, mFirst, mLast, sEmail, sFirst, sLast] = CO[i];
    const mgr = await User.create({
      firstName: mFirst, lastName: mLast, email: mEmail, password: PW,
      userType: 'company', verificationStatus: 'verified', profileComplete: true,
    });
    const company = await Company.create({
      userId: mgr._id, name, email: mEmail, industry, country: 'Ethiopia', city,
      employees: pick(['11-50', '51-200', '201-500'], i), founded: 2012 + i,
      website: `https://${name.toLowerCase().replace(/[^a-z]/g, '')}.et`,
      description: `${name} is an Ethiopian ${industry.toLowerCase()} company that hosts student interns.`,
      verified: true, verificationDate: ago(50), verifiedBy: admin._id,
      recruiters: [mgr._id], status: 'active', totalInternsHired: 3 + i,
    });
    mgr.companyId = company._id;
    await mgr.save();
    // Supervisor — created by the company; logs in with a username.
    const sup = await User.create({
      firstName: sFirst, lastName: sLast, email: sEmail, username: sFirst.toLowerCase(),
      password: PW, userType: 'company', roles: ['supervisor'], companyId: company._id,
      verificationStatus: 'verified', profileComplete: true,
    });
    companies.push({ company, mgr, sup });
  }

  // ── Students (Dawit & Alex are at AAU; Alex is left pending) ──
  const STU = [
    ['dawit@aau.edu.et', 'Dawit', 'Workineh', 0, 'Computer Science', 3.7, ['JavaScript', 'React', 'Node.js'], true],
    ['alex@aau.edu.et', 'Alex', 'Mengistu', 0, 'Software Engineering', 3.4, ['Python', 'Django'], false],
    ['rahel@aau.edu.et', 'Rahel', 'Yohannes', 0, 'Data Science', 3.9, ['Python', 'Pandas', 'Machine Learning'], true],
    ['meron@astu.edu.et', 'Meron', 'Asfaw', 1, 'Computer Science', 3.8, ['Java', 'Spring Boot'], true],
    ['kalkidan@astu.edu.et', 'Kalkidan', 'Demissie', 1, 'Cyber Security', 3.3, ['Linux', 'Networking'], false],
    ['samuel@bdu.edu.et', 'Samuel', 'Girma', 2, 'Information Systems', 3.2, ['SQL', 'PHP'], true],
    ['bethel@hu.edu.et', 'Bethel', 'Tesfaye', 3, 'Software Engineering', 3.6, ['React', 'TypeScript'], true],
    ['natnael@ju.edu.et', 'Natnael', 'Bekele', 4, 'Computer Science', 3.5, ['C++', 'Python'], true],
  ];
  const students = [];
  for (let i = 0; i < STU.length; i += 1) {
    const [email, first, last, uniIdx, major, gpa, skills, verified] = STU[i];
    const user = await User.create({
      firstName: first, lastName: last, email, password: PW,
      userType: 'student', verificationStatus: verified ? 'verified' : 'pending', profileComplete: true,
    });
    const uni = universities[uniIdx].uni;
    const st = await Student.create({
      userId: user._id, universityId: uni._id, studentId: `UGR/${1000 + i * 137}/15`,
      enrollmentYear: 2022, graduationYear: 2026, major, gpa, academicStanding: 'good',
      skills, interests: ['Web Development', 'Software Engineering'], languages: ['Amharic', 'English'],
      desiredLocations: ['Addis Ababa', 'Remote'], workAuthorization: 'Ethiopian citizen',
      verificationStatus: verified ? 'verified' : 'pending',
      universityVerifiedAt: verified ? ago(30) : undefined,
      verifiedBy: verified ? universities[uniIdx].coord._id : undefined,
    });
    students.push({ st, user, uni, coord: universities[uniIdx].coord });
  }

  // ── Internships — 4 per company (20 total), all active ──
  const TITLES = [
    'Frontend Developer Intern', 'Backend Developer Intern', 'Mobile Developer Intern',
    'Data Analyst Intern', 'DevOps Intern', 'UI/UX Design Intern', 'QA Engineer Intern',
    'Cloud Engineer Intern',
  ];
  const SKILLSETS = [['React', 'JavaScript'], ['Node.js', 'MongoDB'], ['Python'], ['Figma', 'CSS']];
  const internships = [];
  for (let c = 0; c < companies.length; c += 1) {
    for (let k = 0; k < 4; k += 1) {
      const title = pick(TITLES, c * 4 + k);
      const it = await Internship.create({
        companyId: companies[c].company._id,
        title,
        description: `Join ${companies[c].company.name} as a ${title}. Work alongside our team on real products and grow your skills.`,
        locations: [pick(['Addis Ababa', 'Remote', 'Adama', 'Bahir Dar'], k)],
        requirements: { minGPA: 3.0, skills: pick(SKILLSETS, k), majors: ['Computer Science', 'Software Engineering'] },
        position: {
          type: pick(['onsite', 'remote', 'hybrid'], k),
          duration: pick(['3 months', '4 months', '6 months'], k),
          paid: k % 2 === 0,
          stipend: k % 2 === 0 ? 6000 + k * 1000 : 0,
        },
        applicationDeadline: days(15 + k * 10),
        postedDate: ago(10),
        totalPositions: 2,
        tags: ['internship', title.split(' ')[0].toLowerCase()],
        viewCount: 10 + k * 7 + c * 3,
        status: 'active',
        createdBy: companies[c].mgr._id,
      });
      internships.push(it);
    }
  }

  // ── Applications — 6 per student, one of every status; the accepted one becomes a placement ──
  const STATUS_K = ['submitted', 'under_review', 'shortlisted', 'offered', 'rejected', 'accepted'];
  const COVER = 'I am very interested in this internship and believe my skills are a strong match for the role.';
  const placements = [];
  const appsByInternship = {};
  for (let si = 0; si < students.length; si += 1) {
    const { st, user, uni } = students[si];
    for (let k = 0; k < STATUS_K.length; k += 1) {
      const it = internships[(si * 5 + k) % internships.length];
      const status = STATUS_K[k];
      const company = companies.find((c) => String(c.company._id) === String(it.companyId));
      const app = await Application.create({
        studentId: st._id, internshipId: it._id, companyId: it.companyId, universityId: uni._id,
        coverLetter: COVER, status, submittedAt: ago(22 - k),
        // A progressed application was university-verified; a still-submitted one
        // is awaiting verification — giving the demo university a live queue.
        universityVerification: {
          status: status === 'submitted' ? 'pending' : 'approved',
          reviewedAt: status === 'submitted' ? undefined : ago(13 - k),
        },
        reviewedAt: status === 'submitted' ? undefined : ago(12 - k),
        reviewedBy: status === 'submitted' ? undefined : company.mgr._id,
        rejectionReason: status === 'rejected' ? 'The position was filled by another candidate.' : undefined,
        statusHistory: [{ status: 'submitted', changedBy: user._id, changedAt: ago(22 - k) }],
      });
      (appsByInternship[String(it._id)] ||= []).push(app._id);

      if (status === 'accepted') {
        const completed = si < 3;
        const placement = await Placement.create({
          applicationId: app._id, studentId: st._id, internshipId: it._id, companyId: it.companyId,
          universityId: uni._id, supervisorId: company.sup._id,
          startDate: ago(40), expectedEndDate: days(30), endDate: completed ? ago(2) : undefined,
          status: completed ? 'completed' : 'active',
          finalReport: completed
            ? { filename: 'final-internship-report.pdf', path: '/uploads/sample-report.pdf', submittedAt: ago(5) }
            : undefined,
          completionApprovedBySupervisor: completed,
          completionValidatedByUniversity: completed,
          confirmedAt: ago(38), confirmedBy: user._id,
        });
        placements.push({ placement, student: students[si], company });
        it.filledPositions = (it.filledPositions || 0) + 1;
      }
    }
  }
  for (const it of internships) {
    if (appsByInternship[String(it._id)]) it.applications = appsByInternship[String(it._id)];
    await it.save();
  }

  // ── Tasks — 5 per placement ──
  const TASK_TITLES = [
    'Set up the development environment', 'Build the landing page UI', 'Write unit tests for the API',
    'Fix the reported bugs', 'Prepare the weekly progress demo', 'Document the REST endpoints',
    'Review the pull request', 'Deploy to the staging environment',
  ];
  const TASK_STATUS = ['assigned', 'in_progress', 'completed', 'in_progress', 'completed'];
  for (let p = 0; p < placements.length; p += 1) {
    const { placement, student, company } = placements[p];
    for (let t = 0; t < 5; t += 1) {
      const status = TASK_STATUS[t];
      const graded = status === 'completed';
      await Task.create({
        placementId: placement._id, studentId: student.st._id, assignedBy: company.sup._id,
        taskNumber: t + 1, // per-student sequence: each student's tasks count from 1
        title: pick(TASK_TITLES, p + t),
        description: 'Complete this task to the described standard. Graded on correctness and clarity.',
        deadline: days(3 + t * 5), status, maxScore: 100,
        progressNote: status === 'completed' ? 'Completed and reviewed.' : status === 'in_progress' ? 'Work in progress.' : '',
        completedAt: status === 'completed' ? ago(1) : undefined,
        score: graded ? 80 + ((p + t) % 16) : undefined,
        feedback: graded ? 'Good work — well structured and delivered on time.' : undefined,
        gradedAt: graded ? ago(1) : undefined,
        gradedBy: graded ? company.sup._id : undefined,
      });
    }
  }

  // Demo flavour for the first placement: an auto-zeroed overdue task and a
  // completed task whose grade the student has appealed. These continue that
  // student's own sequence (already at 5 from the loop above) → tasks 6 and 7.
  const demoTask = placements[0];
  await Task.create({
    placementId: demoTask.placement._id, studentId: demoTask.student.st._id,
    assignedBy: demoTask.company.sup._id, taskNumber: 6,
    title: 'Submit the database schema diagram',
    description: 'This task was not submitted before its deadline.',
    deadline: ago(4), status: 'overdue', maxScore: 100,
    score: 0, autoZeroed: true, gradedAt: ago(3),
    feedback: 'Automatically scored 0 — the deadline passed without a completed submission.',
  });
  await Task.create({
    placementId: demoTask.placement._id, studentId: demoTask.student.st._id,
    assignedBy: demoTask.company.sup._id, taskNumber: 7,
    title: 'Refactor the authentication module',
    description: 'Completed work — the student has appealed the grade.',
    deadline: ago(8), status: 'completed', maxScore: 100,
    completedAt: ago(9), score: 72, gradedAt: ago(7), gradedBy: demoTask.company.sup._id,
    feedback: 'Solid effort, but several edge cases were missed.',
    gradeAppeal: {
      reason: 'I believe the edge cases mentioned were outside the task scope — please reconsider.',
      status: 'pending', submittedAt: ago(2),
    },
  });

  // ── Assessments — one per placement (first 6 submitted with scores) ──
  for (let p = 0; p < placements.length; p += 1) {
    const { placement, student, company } = placements[p];
    const submitted = p < 6;
    await Assessment.create({
      placementId: placement._id, studentId: student.st._id, supervisorId: company.sup._id,
      score: submitted ? 78 + p * 3 : undefined,
      remarks: submitted ? 'Solid technical work, good communication and reliability.' : undefined,
      criteria: submitted
        ? [{ name: 'Technical skill', score: 85 }, { name: 'Communication', score: 80 }, { name: 'Reliability', score: 88 }]
        : [],
      submitted,
      submittedDate: submitted ? ago(3) : undefined,
    });
  }

  // ── Messages — a thread per placement (intern ↔ supervisor) ──
  for (let p = 0; p < placements.length; p += 1) {
    const { placement, student, company } = placements[p];
    const convo = [
      ['supervisor', company.sup._id, 'Welcome aboard! Let me know if you have questions about your first task.'],
      ['student', student.user._id, 'Thank you! I have started setting up the environment.'],
      ['supervisor', company.sup._id, 'Great — share a screenshot once the build runs.'],
    ];
    for (const [senderRole, senderId, body] of convo) {
      await Message.create({ placementId: placement._id, senderId, senderRole, body });
    }
  }

  // ── Verification records (universities, companies, verified students) ──
  for (const { uni, coord } of universities) {
    await Verification.create({
      entityType: 'university', entityId: uni._id, requestedBy: coord._id, reviewedBy: admin._id,
      status: 'approved', remarks: 'Accreditation confirmed.', requestedAt: ago(62), reviewedAt: ago(60),
    });
  }
  for (const { company, mgr } of companies) {
    await Verification.create({
      entityType: 'company', entityId: company._id, requestedBy: mgr._id, reviewedBy: admin._id,
      status: 'approved', remarks: 'Company registration verified.', requestedAt: ago(52), reviewedAt: ago(50),
    });
  }
  for (const { st, user, coord } of students.filter((s) => s.st.verificationStatus === 'verified')) {
    await Verification.create({
      entityType: 'student', entityId: st._id, requestedBy: user._id, reviewedBy: coord._id,
      status: 'approved', remarks: 'Academic standing verified.', requestedAt: ago(32), reviewedAt: ago(30),
    });
  }

  // ── A rejected verification + a pending appeal (demo for the appeals workflow) ──
  const appealStudent = students[4]; // Kalkidan — left pending
  const rejectedVerification = await Verification.create({
    entityType: 'student', entityId: appealStudent.st._id,
    requestedBy: appealStudent.user._id, reviewedBy: appealStudent.coord._id,
    status: 'rejected', rejectionReason: 'The submitted transcript was unclear.',
    remarks: 'Please resubmit a clearer copy of your transcript.',
    requestedAt: ago(20), reviewedAt: ago(18),
  });
  await VerificationAppeal.create({
    verificationId: rejectedVerification._id, submittedBy: appealStudent.user._id,
    reason: 'My transcript is official and stamped by the registrar — please reconsider.',
    status: 'pending', submittedAt: ago(15),
  });

  // ── Invitations — each university invites 2 companies ──
  for (let u = 0; u < universities.length; u += 1) {
    for (let n = 0; n < 2; n += 1) {
      const target = companies[(u + n) % companies.length];
      await Invitation.create({
        universityId: universities[u].uni._id, companyId: target.company._id,
        sentBy: universities[u].coord._id,
        message: 'We would like to partner with your company for our student internship programme.',
        status: pick(['sent', 'accepted', 'declined'], u + n),
        respondedAt: (u + n) % 3 === 0 ? undefined : ago(5),
      });
    }
  }

  // ── Notifications — 5 per active user ──
  const NOTE = [
    ['application', 'Application update', 'The status of one of your applications has changed.'],
    ['internship', 'New internship posted', 'A new internship matching your interests is now open.'],
    ['placement', 'Supervisor assigned', 'A supervisor has been assigned to your internship.'],
    ['task', 'New task assigned', 'Your supervisor has assigned you a new task.'],
    ['assessment', 'Assessment completed', 'Your performance assessment has been submitted.'],
    ['system', 'Welcome to InternConnect', 'Your account is ready — explore the dashboard.'],
  ];
  const recipients = [
    ...students.map((s) => s.user),
    ...companies.map((c) => c.mgr),
    ...companies.map((c) => c.sup),
    ...universities.map((u) => u.coord),
    admin,
  ];
  for (let r = 0; r < recipients.length; r += 1) {
    for (let n = 0; n < 5; n += 1) {
      const [type, title, message] = pick(NOTE, r + n);
      await Notification.create({
        userId: recipients[r]._id, type, title, message,
        read: n >= 3, readAt: n >= 3 ? ago(1) : undefined,
      });
    }
  }

  // ── Audit log entries ──
  const ACTIONS = [
    'USER_LOGIN', 'USER_REGISTER', 'INTERNSHIP_CREATE', 'APPLICATION_SUBMIT',
    'APPLICATION_STATUS_CHANGE', 'STUDENT_VERIFY', 'ORGANIZATION_VERIFY',
    'SUPERVISOR_ASSIGN', 'OFFER_ACCEPT', 'REPORT_GENERATE', 'TASK_ASSIGN', 'ASSESSMENT_SUBMIT',
  ];
  for (let i = 0; i < ACTIONS.length; i += 1) {
    const actor = pick([...students.map((s) => s.user), ...companies.map((c) => c.mgr), admin], i);
    await AuditLog.create({
      userId: actor._id, userType: actor.userType, action: ACTIONS[i],
      entityType: 'System', status: i % 7 === 6 ? 'failure' : 'success',
      errorMessage: i % 7 === 6 ? 'Operation failed validation' : undefined,
      ipAddress: '127.0.0.1', userAgent: 'Seed script',
    });
  }

  // ── Reports — 5 per university coordinator, company manager, and the admin ──
  const reportRows = [
    { metric: 'totalPlacements', value: placements.length },
    { metric: 'completed', value: 3 },
    { metric: 'active', value: placements.length - 3 },
  ];
  for (const { coord } of universities) {
    for (let n = 0; n < 5; n += 1) {
      await Report.create({
        type: 'university', title: 'University placement & completion report',
        generatedBy: coord._id, filters: {},
        payload: { title: 'University placement & completion report', summary: { totalPlacements: placements.length, completed: 3 }, rows: reportRows },
      });
    }
  }
  for (const { mgr } of companies) {
    for (let n = 0; n < 5; n += 1) {
      await Report.create({
        type: 'company', title: 'Company recruitment analytics',
        generatedBy: mgr._id, filters: {},
        payload: { title: 'Company recruitment analytics', summary: { internships: 4, totalApplications: 12 }, rows: reportRows },
      });
    }
  }
  for (let n = 0; n < 5; n += 1) {
    await Report.create({
      type: 'audit', title: 'System-wide report', generatedBy: admin._id, filters: {},
      payload: { title: 'System-wide report', summary: { users: recipients.length }, rows: reportRows },
    });
  }

  console.log('\nSeed complete:');
  console.log(`  Users:         ${await User.countDocuments()}`);
  console.log(`  Students:      ${await Student.countDocuments()}`);
  console.log(`  Universities:  ${await University.countDocuments()}`);
  console.log(`  Companies:     ${await Company.countDocuments()}`);
  console.log(`  Internships:   ${await Internship.countDocuments()}`);
  console.log(`  Applications:  ${await Application.countDocuments()}`);
  console.log(`  Placements:    ${await Placement.countDocuments()}`);
  console.log(`  Tasks:         ${await Task.countDocuments()}`);
  console.log(`  Assessments:   ${await Assessment.countDocuments()}`);
  console.log(`  Verifications: ${await Verification.countDocuments()}`);
  console.log(`  Invitations:   ${await Invitation.countDocuments()}`);
  console.log(`  Notifications: ${await Notification.countDocuments()}`);
  console.log(`  Audit logs:    ${await AuditLog.countDocuments()}`);
  console.log(`  Reports:       ${await Report.countDocuments()}`);
  console.log(`  Messages:      ${await Message.countDocuments()}`);
  console.log('\nDemo logins (password for all: Password123!):');
  console.log('  admin@internconnect.et       — admin');
  console.log('  coordinator@aau.edu.et       — university');
  console.log('  hr@zemen-tech.et             — company manager');
  console.log('  daniel  (or daniel@zemen-tech.et) — supervisor (logs in by username)');
  console.log('  dawit@aau.edu.et             — student (verified)');
  console.log('  alex@aau.edu.et              — student (pending)');

  await mongoose.disconnect();
  console.log('\nDisconnected.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
