#!/usr/bin/env python3
"""Generate InternConnect presentation (18 slides)."""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ── Constants ──
BLUE   = RGBColor(0x1E, 0x40, 0xAF)   # primary accent
DARK   = RGBColor(0x1E, 0x29, 0x3B)   # dark text
GRAY   = RGBColor(0x64, 0x74, 0x8B)   # secondary text
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_BG = RGBColor(0xF1, 0xF5, 0xF9) # light background
ACCENT_BG = RGBColor(0xDB, 0xEA, 0xFE) # light blue bg

prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)

SW = prs.slide_width
SH = prs.slide_height

# ── Helpers ──

def add_bg(slide, color=WHITE):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_rect(slide, left, top, width, height, color):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape

def add_rounded_rect(slide, left, top, width, height, color):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape

def add_text_box(slide, left, top, width, height):
    return slide.shapes.add_textbox(left, top, width, height)

def set_text(tf, text, size=18, color=DARK, bold=False, alignment=PP_ALIGN.LEFT):
    tf.clear()
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.alignment = alignment
    return p

def add_para(tf, text, size=16, color=DARK, bold=False, space_before=Pt(6), bullet=False):
    p = tf.add_paragraph()
    p.text = text
    p.font.size = Pt(size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.space_before = space_before
    if bullet:
        p.level = 0
    return p

def add_bullet_list(tf, items, size=16, color=DARK, bold=False):
    for item in items:
        p = tf.add_paragraph()
        p.text = item
        p.font.size = Pt(size)
        p.font.color.rgb = color
        p.font.bold = bold
        p.space_before = Pt(6)
        p.level = 0

def slide_header(slide, title, subtitle=None):
    add_rect(slide, 0, 0, SW, Inches(1.3), BLUE)
    tb = add_text_box(slide, Inches(0.8), Inches(0.25), Inches(11), Inches(0.7))
    set_text(tb.text_frame, title, size=32, color=WHITE, bold=True)
    if subtitle:
        tb2 = add_text_box(slide, Inches(0.8), Inches(0.85), Inches(11), Inches(0.4))
        set_text(tb2.text_frame, subtitle, size=16, color=RGBColor(0xBF, 0xDB, 0xFE))

def slide_number(slide, num, total=18):
    tb = add_text_box(slide, Inches(12.0), Inches(7.0), Inches(1.2), Inches(0.4))
    set_text(tb.text_frame, f"{num} / {total}", size=11, color=GRAY, alignment=PP_ALIGN.RIGHT)

def content_card(slide, left, top, width, height, title, items, card_color=WHITE, title_color=BLUE):
    card = add_rounded_rect(slide, left, top, width, height, card_color)
    card.shadow.inherit = False
    tb = add_text_box(slide, left + Inches(0.25), top + Inches(0.15), width - Inches(0.5), height - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    set_text(tf, title, size=18, color=title_color, bold=True)
    for item in items:
        add_para(tf, item, size=14, color=DARK)
    return card

# ════════════════════════════════════════════════════════════
# SLIDE 1 — Title Slide
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])  # blank
add_bg(sl, BLUE)

# Decorative accent
add_rect(sl, 0, 0, SW, Inches(0.15), RGBColor(0x15, 0x30, 0x8A))

tb = add_text_box(sl, Inches(1.5), Inches(1.2), Inches(10), Inches(1.0))
set_text(tb.text_frame, "ADDIS ABABA UNIVERSITY", size=18, color=RGBColor(0xBF, 0xDB, 0xFE), alignment=PP_ALIGN.CENTER)
add_para(tb.text_frame, "College of Natural and Computational Sciences", size=14, color=RGBColor(0x93, 0xBB, 0xFB))
add_para(tb.text_frame, "Department of Computer Science", size=14, color=RGBColor(0x93, 0xBB, 0xFB))

tb2 = add_text_box(sl, Inches(1.5), Inches(2.8), Inches(10), Inches(1.2))
set_text(tb2.text_frame, "InternConnect", size=52, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
add_para(tb2.text_frame, "Internship Management System", size=28, color=RGBColor(0xBF, 0xDB, 0xFE))
tb2.text_frame.paragraphs[-1].alignment = PP_ALIGN.CENTER

tb3 = add_text_box(sl, Inches(1.5), Inches(4.6), Inches(10), Inches(0.5))
set_text(tb3.text_frame, "Final Year Project Presentation", size=20, color=RGBColor(0x93, 0xBB, 0xFB), alignment=PP_ALIGN.CENTER)

# Team members
tb4 = add_text_box(sl, Inches(2.0), Inches(5.5), Inches(5), Inches(1.5))
tf4 = tb4.text_frame
set_text(tf4, "Team Members", size=14, color=RGBColor(0xBF, 0xDB, 0xFE), bold=True)
for name in ["Addis Alemayehu  (UGR/4143/15)", "Bersufikad Mihret  (UGR/4785/15)",
             "Dawit Workiye  (UGR/4403/15)", "Dejen Achenef  (UGR/7100/15)"]:
    add_para(tf4, name, size=13, color=WHITE)

tb5 = add_text_box(sl, Inches(8.0), Inches(5.5), Inches(4), Inches(1.0))
tf5 = tb5.text_frame
set_text(tf5, "Advisor: Mr. Samuel G.", size=14, color=RGBColor(0xBF, 0xDB, 0xFE), bold=True)
add_para(tf5, "Date: January 2025", size=13, color=WHITE)

slide_number(sl, 1)

# ════════════════════════════════════════════════════════════
# SLIDE 2 — Agenda / Outline
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Presentation Outline")

items = [
    ("1.", "Introduction & Problem Statement"),
    ("2.", "Objectives & Scope"),
    ("3.", "System Development Methodology"),
    ("4.", "Requirement Analysis & Use Cases"),
    ("5.", "System Architecture (3-Tier)"),
    ("6.", "Technology Stack (MERN)"),
    ("7.", "Database Design (MongoDB Collections)"),
    ("8.", "Authentication, RBAC & Security"),
    ("9.", "Core Features Walkthrough"),
]
items2 = [
    ("10.", "Internship & Application Workflow"),
    ("11.", "Supervisor, Tasks & Assessments"),
    ("12.", "Notifications, Dashboards & Reports"),
    ("13.", "Frontend Architecture & UI Design"),
    ("14.", "API & Backend Structure"),
    ("15.", "Testing & Quality Assurance"),
    ("16.", "Key Codebase Statistics"),
    ("17.", "Challenges & Future Work"),
    ("18.", "Conclusion & Demo"),
]

for col_idx, col_items in enumerate([items, items2]):
    left = Inches(1.0) + Inches(col_idx * 6)
    tb = add_text_box(sl, left, Inches(1.6), Inches(5.5), Inches(5.5))
    tf = tb.text_frame
    tf.word_wrap = True
    first = True
    for num, text in col_items:
        if first:
            set_text(tf, f"{num}  {text}", size=17, color=DARK)
            first = False
        else:
            add_para(tf, f"{num}  {text}", size=17, color=DARK, space_before=Pt(12))

slide_number(sl, 2)

# ════════════════════════════════════════════════════════════
# SLIDE 3 — Introduction & Problem Statement
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Introduction & Problem Statement")

# Left: intro
tb = add_text_box(sl, Inches(0.8), Inches(1.6), Inches(5.8), Inches(5.5))
tf = tb.text_frame
tf.word_wrap = True
set_text(tf, "The Problem", size=22, color=BLUE, bold=True)
add_para(tf, "", size=8)
problems = [
    "Internship management in Ethiopian universities relies on manual, paper-based processes",
    "Communication scattered across emails, phone calls, and in-person interactions",
    "Students uncertain about application status; universities can't track progress",
    "Inconsistent document formats lead to errors and extra administrative work",
    "Manual review processes are slow — decisions take days or weeks",
    "No centralized record-keeping for placements, assessments, or compliance",
]
for p in problems:
    add_para(tf, f"  {p}", size=14, color=DARK, space_before=Pt(8))

# Right: solution box
card = add_rounded_rect(sl, Inches(7.0), Inches(1.6), Inches(5.5), Inches(5.2), ACCENT_BG)
tb2 = add_text_box(sl, Inches(7.3), Inches(1.8), Inches(5.0), Inches(5.0))
tf2 = tb2.text_frame
tf2.word_wrap = True
set_text(tf2, "Our Solution: InternConnect", size=22, color=BLUE, bold=True)
add_para(tf2, "", size=8)
solutions = [
    "A comprehensive web-based system that digitizes the entire internship lifecycle",
    "Connects students, companies, universities, supervisors, and administrators",
    "Centralizes posting, applications, approvals, task management, and reporting",
    "Role-based access ensures each stakeholder sees only relevant data",
    "Transparent, accountable, and auditable workflows throughout",
]
for s in solutions:
    add_para(tf2, f"  {s}", size=14, color=DARK, space_before=Pt(8))

slide_number(sl, 3)

# ════════════════════════════════════════════════════════════
# SLIDE 4 — Objectives & Scope
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Objectives & Scope")

# General objective
tb = add_text_box(sl, Inches(0.8), Inches(1.6), Inches(11.5), Inches(1.0))
tf = tb.text_frame
tf.word_wrap = True
set_text(tf, "General Objective", size=20, color=BLUE, bold=True)
add_para(tf, "Design and develop InternConnect — a web-based system that streamlines internship management for students, universities, and companies in Ethiopia.", size=15, color=DARK, space_before=Pt(8))

# Specific objectives
tb2 = add_text_box(sl, Inches(0.8), Inches(3.0), Inches(5.5), Inches(4.0))
tf2 = tb2.text_frame
tf2.word_wrap = True
set_text(tf2, "Specific Objectives", size=20, color=BLUE, bold=True)
objs = [
    "Gather requirements from all stakeholders via interviews, surveys, and document analysis",
    "Organize requirements into functional & non-functional specifications",
    "Design a role-based web application with internship tracking, assessment, and reporting",
    "Implement using the MERN stack for scalability, responsiveness, and security",
    "Test and evaluate with predefined test cases to verify functionality and reliability",
]
for o in objs:
    add_para(tf2, f"  {o}", size=13, color=DARK, space_before=Pt(6))

# Scope & Limitations
tb3 = add_text_box(sl, Inches(6.8), Inches(3.0), Inches(5.8), Inches(4.0))
tf3 = tb3.text_frame
tf3.word_wrap = True
set_text(tf3, "Scope", size=20, color=BLUE, bold=True)
add_para(tf3, "Full internship cycle: application submission through completion, for Ethiopian universities and local partner companies.", size=13, color=DARK, space_before=Pt(6))
add_para(tf3, "", size=8)
add_para(tf3, "Limitations", size=20, color=BLUE, bold=True)
lims = [
    "No international company support — Ethiopian context only",
    "No financial transactions or payment gateway",
    "No AI-based predictive placement recommendations",
]
for l in lims:
    add_para(tf3, f"  {l}", size=13, color=DARK, space_before=Pt(6))

slide_number(sl, 4)

# ════════════════════════════════════════════════════════════
# SLIDE 5 — System Development Methodology
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "System Development Methodology")

tb = add_text_box(sl, Inches(0.8), Inches(1.6), Inches(5.5), Inches(5.5))
tf = tb.text_frame
tf.word_wrap = True
set_text(tf, "Agile SDLC", size=22, color=BLUE, bold=True)
add_para(tf, "", size=6)
agile_points = [
    "Iterative development in short sprints (2-4 weeks)",
    "Close collaboration between team and stakeholders",
    "Continuous feedback incorporation and priority adjustment",
    "Each sprint includes planning, development, and testing",
    "Flexibility to respond to changing requirements",
    "Self-managed, cross-functional team approach",
]
for a in agile_points:
    add_para(tf, f"  {a}", size=14, color=DARK, space_before=Pt(8))

tb2 = add_text_box(sl, Inches(6.8), Inches(1.6), Inches(5.8), Inches(5.5))
tf2 = tb2.text_frame
tf2.word_wrap = True
set_text(tf2, "Investigation Methods", size=22, color=BLUE, bold=True)
add_para(tf2, "", size=6)
methods = [
    ("Questionnaires", "Quantitative data from students, staff, and companies on requirements and expectations"),
    ("Interviews", "One-on-one qualitative insights from supervisors, coordinators, and managers"),
    ("Document Analysis", "Review of existing manual forms, records, and tracking processes to identify inefficiencies"),
]
for title, desc in methods:
    add_para(tf2, title, size=15, color=BLUE, bold=True, space_before=Pt(14))
    add_para(tf2, desc, size=13, color=DARK, space_before=Pt(2))

slide_number(sl, 5)

# ════════════════════════════════════════════════════════════
# SLIDE 6 — Requirement Analysis & Use Cases
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Requirement Analysis & Key Use Cases")

# Functional requirements
tb = add_text_box(sl, Inches(0.8), Inches(1.6), Inches(5.8), Inches(5.5))
tf = tb.text_frame
tf.word_wrap = True
set_text(tf, "14 Functional Requirements", size=20, color=BLUE, bold=True)
add_para(tf, "", size=4)
frs = [
    "FR1 — User Registration & Authentication",
    "FR2 — Role-Based Access Control",
    "FR3 — Internship Posting & Browsing",
    "FR4 — Application Submission & Tracking",
    "FR5 — Internship Progress Monitoring",
    "FR6 — Task Assignment & Management",
    "FR7 — Assessment & Evaluation",
    "FR8 — Offer & Placement Management",
    "FR9 — Application Review & Selection",
    "FR10 — Shortlisting Candidates",
    "FR11 — University-Company Invitations",
    "FR12 — Reporting & Analytics",
    "FR13 — Admin Account Management",
    "FR14 — Audit & System Monitoring",
]
for fr in frs:
    add_para(tf, fr, size=12, color=DARK, space_before=Pt(4))

# Use cases
tb2 = add_text_box(sl, Inches(7.0), Inches(1.6), Inches(5.8), Inches(5.5))
tf2 = tb2.text_frame
tf2.word_wrap = True
set_text(tf2, "19 Use Cases (Selected)", size=20, color=BLUE, bold=True)
add_para(tf2, "", size=4)
ucs = [
    "UC001 — Login / Logout / Session",
    "UC002 — Register & Complete Profile",
    "UC003 — Submit Application",
    "UC004 — Track Application Status",
    "UC005 — Search Organizations",
    "UC007 — Review Applications",
    "UC009 — Assign Supervisor",
    "UC010 — Assign Tasks to Intern",
    "UC011 — Request & Submit Assessment",
    "UC012 — Verify Entities (Admin)",
    "UC013 — Generate Reports",
    "UC014 — Conduct Audit Review",
    "UC016 — Withdraw Application",
    "UC017 — Accept/Reject Offer",
    "UC018 — Complete Internship",
    "UC019 — Receive Notifications",
]
for uc in ucs:
    add_para(tf2, uc, size=12, color=DARK, space_before=Pt(4))

slide_number(sl, 6)

# ════════════════════════════════════════════════════════════
# SLIDE 7 — System Architecture
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "System Architecture — 3-Tier MERN")

# Presentation Tier
content_card(sl, Inches(0.8), Inches(1.8), Inches(3.6), Inches(4.8),
    "Presentation Tier", [
        "React 18 + Vite (SPA)",
        "Tailwind CSS + Glassmorphism",
        "React Router v6",
        "AuthContext + ProtectedRoute",
        "Responsive, mobile-first UI",
        "Dark/Light mode toggle",
        "Lucide-react icons",
        "Recharts for analytics",
    ], ACCENT_BG)

# Application Tier
content_card(sl, Inches(4.8), Inches(1.8), Inches(3.8), Inches(4.8),
    "Application Tier", [
        "Node.js + Express REST API",
        "17 route modules",
        "17 controller files",
        "JWT access + refresh tokens",
        "RBAC middleware (Table 3.1)",
        "Audit logging middleware",
        "Multer file upload handling",
        "Centralized error handler",
    ], RGBColor(0xDC, 0xFC, 0xE7))

# Data Tier
content_card(sl, Inches(9.0), Inches(1.8), Inches(3.8), Inches(4.8),
    "Data Tier", [
        "MongoDB + Mongoose ODM",
        "15 collections (models)",
        "Indexed for performance",
        "Soft-delete support on Users",
        "Append-only AuditLog",
        "TTL-expiring Notifications",
        "Seed script for demo data",
        "Schema validation & refs",
    ], RGBColor(0xFE, 0xF3, 0xC7))

slide_number(sl, 7)

# ════════════════════════════════════════════════════════════
# SLIDE 8 — Technology Stack
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Technology Stack")

categories = [
    ("Frontend", [
        "React 18 — Component-based UI",
        "Vite — Fast dev server & bundling",
        "Tailwind CSS — Utility-first styling",
        "React Router v6 — Client-side routing",
        "Axios — HTTP client with interceptors",
        "Recharts — Interactive charts",
        "Lucide React — Icon library",
    ]),
    ("Backend", [
        "Node.js — JavaScript runtime",
        "Express.js — REST API framework",
        "Mongoose — MongoDB ODM",
        "JWT (jsonwebtoken) — Auth tokens",
        "bcrypt — Password hashing",
        "Multer — File upload handling",
        "PDFKit + ExcelJS — Report export",
    ]),
    ("Database & Tools", [
        "MongoDB — NoSQL document store",
        "Git / GitHub — Version control",
        "Postman — API testing",
        "Figma — UI/UX design",
        "Vercel — Frontend deployment",
        "Render — Backend deployment",
        "Docker — Containerization (planned)",
    ]),
]

for i, (title, items) in enumerate(categories):
    left = Inches(0.8) + Inches(i * 4.2)
    card = add_rounded_rect(sl, left, Inches(1.8), Inches(3.8), Inches(5.0), LIGHT_BG)
    tb = add_text_box(sl, left + Inches(0.2), Inches(1.9), Inches(3.4), Inches(4.8))
    tf = tb.text_frame
    tf.word_wrap = True
    set_text(tf, title, size=20, color=BLUE, bold=True)
    for item in items:
        add_para(tf, f"  {item}", size=13, color=DARK, space_before=Pt(6))

slide_number(sl, 8)

# ════════════════════════════════════════════════════════════
# SLIDE 9 — Database Design
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Database Design — 15 MongoDB Collections")

collections = [
    ("User", "Auth record: email, password (bcrypt), userType, roles[], permissions[], status, verification, lockout"),
    ("Student", "userId ref, university, studentId, major, GPA, skills[], CV, certifications, portfolio, experience"),
    ("University", "Name, domain, country, departments[], verified status, admins[], verificationRules"),
    ("Company", "Name, industry, logo, verified, recruiters[], totalInternsHired, averageRating"),
    ("Internship", "companyId, title, requirements, positions, deadline, status lifecycle, tags[], viewCount"),
    ("Application", "studentId, internshipId, coverLetter, attachments[], statusHistory[] (audit trail)"),
    ("Placement", "applicationId, studentId, companyId, supervisorHistory[], engagementStartedAt"),
    ("Verification", "entityType, documents[], status, reviewedBy + VerificationAppeal sub-collection"),
    ("AuditLog", "Append-only: userId, action, entityType, changes{before,after}, ipAddress, userAgent"),
    ("Notification", "userId, type, channel (email/in_app/sms), read status, 90-day TTL auto-expire"),
    ("Task", "Placement-scoped, taskNumber (per-student), deadline, grade, gradeAppeal, deliverables"),
    ("Assessment", "placementId, supervisorId, score, remarks — immutable after submission"),
    ("Report", "type (university/company/audit), filters, generated payload, PDF/Excel/CSV export"),
    ("Invitation", "University invites company, optional message, status tracking"),
    ("Message", "Supervisor-student chat threads, per-placement, with engagement boundary support"),
]

tb = add_text_box(sl, Inches(0.6), Inches(1.5), Inches(12.2), Inches(5.8))
tf = tb.text_frame
tf.word_wrap = True
first = True
for name, desc in collections:
    if first:
        set_text(tf, f"{name}  —  {desc}", size=12, color=DARK)
        tf.paragraphs[0].font.bold = False
        run = tf.paragraphs[0].runs[0]
        # Make collection name bold by rewriting
        first = False
    else:
        p = add_para(tf, f"{name}  —  {desc}", size=12, color=DARK, space_before=Pt(4))

# Highlight collection names
for p in tf.paragraphs:
    if p.text and "  —  " in p.text:
        parts = p.text.split("  —  ", 1)
        p.clear()
        run1 = p.add_run()
        run1.text = parts[0]
        run1.font.size = Pt(13)
        run1.font.bold = True
        run1.font.color.rgb = BLUE
        run2 = p.add_run()
        run2.text = f"  —  {parts[1]}"
        run2.font.size = Pt(12)
        run2.font.color.rgb = DARK

slide_number(sl, 9)

# ════════════════════════════════════════════════════════════
# SLIDE 10 — Authentication, RBAC & Security
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Authentication, RBAC & Security")

# Auth
content_card(sl, Inches(0.8), Inches(1.8), Inches(3.8), Inches(5.0),
    "Authentication", [
        "JWT access + refresh token pair",
        "bcrypt password hashing (salt rounds)",
        "Account lockout after failed attempts",
        "Session timeout enforcement",
        "Login by email OR username",
        "Academic email validation for students",
        "  (.edu, .edu.xx, .ac.xx domains)",
        "Credential change endpoint (PATCH)",
    ], LIGHT_BG)

# RBAC
content_card(sl, Inches(4.9), Inches(1.8), Inches(3.8), Inches(5.0),
    "Role-Based Access Control", [
        "4 userTypes: student, university,",
        "  company, admin",
        "Sub-roles via roles[]: supervisor,",
        "  auditor, manager",
        "permissions[] per-user granularity",
        "RBAC middleware on every route",
        "Table 3.1 permission matrix enforced",
        "Company: manager vs supervisor split",
    ], LIGHT_BG)

# Security
content_card(sl, Inches(9.0), Inches(1.8), Inches(3.8), Inches(5.0),
    "Security & Compliance", [
        "Immutable append-only AuditLog",
        "Every action logged with IP, user-agent",
        "Input validation on all endpoints",
        "Rate limiting (50 req / 15 min auth)",
        "Centralized error handler (no leaks)",
        "Soft-delete (no permanent data loss)",
        "CORS configuration",
        "File upload restrictions (Multer)",
    ], LIGHT_BG)

slide_number(sl, 10)

# ════════════════════════════════════════════════════════════
# SLIDE 11 — Core Features: User Roles
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Core Features — By User Role")

roles = [
    ("Student", [
        "Register with academic email",
        "Complete profile (CV required)",
        "Add portfolio, certifications, experience",
        "Browse & search internships",
        "Apply with cover letter + attachments",
        "Track application status in real-time",
        "View assigned tasks & submit deliverables",
        "Request assessments, appeal grades",
        "Chat with supervisor, submit final report",
    ]),
    ("Company", [
        "Register & complete company profile",
        "Post internships (draft/publish/close)",
        "Review applications, shortlist, accept/reject",
        "Create supervisor accounts",
        "Assign supervisors to placements",
        "Reassign supervisors (continue/fresh mode)",
        "Manager dashboard with overview stats",
    ]),
    ("University", [
        "Register & set verification rules",
        "Verify students (enrollment, documents)",
        "Verify student applications at apply-time",
        "Search & invite partner companies",
        "Monitor student placements & progress",
        "Generate placement & completion reports",
        "Validate final internship reports",
    ]),
    ("Admin", [
        "Verify companies & universities",
        "Manage all user accounts",
        "Activate / deactivate / suspend users",
        "View system-wide audit logs",
        "Generate admin analytics reports",
        "System monitoring & compliance",
    ]),
]

for i, (role, features) in enumerate(roles):
    left = Inches(0.5) + Inches(i * 3.15)
    w = Inches(3.0)
    card = add_rounded_rect(sl, left, Inches(1.7), w, Inches(5.3), LIGHT_BG)
    tb = add_text_box(sl, left + Inches(0.15), Inches(1.8), w - Inches(0.3), Inches(5.1))
    tf = tb.text_frame
    tf.word_wrap = True
    set_text(tf, role, size=18, color=BLUE, bold=True, alignment=PP_ALIGN.CENTER)
    for f in features:
        add_para(tf, f"  {f}", size=11, color=DARK, space_before=Pt(3))

slide_number(sl, 11)

# ════════════════════════════════════════════════════════════
# SLIDE 12 — Internship & Application Workflow
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Internship & Application Workflow")

# Flow steps
steps = [
    ("1. Post", "Company creates internship\n(draft > pending > active)"),
    ("2. Browse", "Students search & filter\ninternships (location, field)"),
    ("3. Apply", "Student submits application\nwith CV, portfolio, cover letter"),
    ("4. Univ. Verify", "University verifies student\nenrollment & documents"),
    ("5. Review", "Company reviews, shortlists,\naccepts or rejects"),
    ("6. Offer", "Student accepts/rejects offer;\nPlacement record created"),
]

for i, (title, desc) in enumerate(steps):
    left = Inches(0.5) + Inches(i * 2.1)
    card = add_rounded_rect(sl, left, Inches(1.8), Inches(1.95), Inches(2.5), ACCENT_BG)
    tb = add_text_box(sl, left + Inches(0.1), Inches(1.9), Inches(1.75), Inches(2.3))
    tf = tb.text_frame
    tf.word_wrap = True
    set_text(tf, title, size=15, color=BLUE, bold=True, alignment=PP_ALIGN.CENTER)
    add_para(tf, desc, size=11, color=DARK, space_before=Pt(8))
    tf.paragraphs[-1].alignment = PP_ALIGN.CENTER

# Application status lifecycle
tb2 = add_text_box(sl, Inches(0.8), Inches(4.7), Inches(12), Inches(0.6))
set_text(tb2.text_frame, "Application Status Lifecycle", size=20, color=BLUE, bold=True)

statuses = "submitted  >  under_review  >  shortlisted  >  accepted  >  offered  >  placed"
tb3 = add_text_box(sl, Inches(0.8), Inches(5.3), Inches(12), Inches(0.5))
set_text(tb3.text_frame, statuses, size=16, color=DARK, alignment=PP_ALIGN.CENTER)

tb4 = add_text_box(sl, Inches(0.8), Inches(5.9), Inches(12), Inches(1.0))
tf4 = tb4.text_frame
tf4.word_wrap = True
set_text(tf4, "Key Business Rules:", size=14, color=BLUE, bold=True)
rules = [
    "One application per internship per student  |  University verification gate before company review",
    "Student can withdraw before review  |  Immutable statusHistory[] for full audit trail",
    "Profile must be complete (CV required) before applying  |  Attachments from profile suggested at apply time",
]
for r in rules:
    add_para(tf4, f"  {r}", size=12, color=DARK, space_before=Pt(4))

slide_number(sl, 12)

# ════════════════════════════════════════════════════════════
# SLIDE 13 — Supervisor, Tasks & Assessments
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Supervisor, Tasks & Assessments")

# Supervisor workspace
content_card(sl, Inches(0.8), Inches(1.8), Inches(3.8), Inches(5.0),
    "Supervisor Workspace", [
        "Manager creates supervisor accounts",
        "  (username + temp password)",
        "Dedicated supervisor dashboard & nav",
        "Supervisor assigned to placements",
        "Reassignment: continue or fresh mode",
        "  (inherits or starts new chat thread)",
        "supervisorHistory[] as audit trail",
        "Placement-scoped task visibility",
    ], LIGHT_BG)

# Tasks
content_card(sl, Inches(4.9), Inches(1.8), Inches(3.8), Inches(5.0),
    "Task Management", [
        "Supervisor assigns tasks with deadlines",
        "Required deliverables per task",
        "  (document / link / note types)",
        "Student submits deliverables via upload",
        "Per-student sequential numbering (TSK-0042)",
        "Bulk assign to all active interns",
        "Auto-zero on missed deadline (lazy eval)",
        "Grade appeal workflow (student > supervisor)",
        "Appeal with optional document attachments",
    ], LIGHT_BG)

# Assessments
content_card(sl, Inches(9.0), Inches(1.8), Inches(3.8), Inches(5.0),
    "Assessments & Completion", [
        "Student requests assessment",
        "Supervisor fills score + remarks",
        "Immutable after submission",
        "Student submits final internship report",
        "Supervisor confirms completion",
        "University validates final report",
        "Internship marked completed & archived",
        "Full end-to-end internship lifecycle",
    ], LIGHT_BG)

slide_number(sl, 13)

# ════════════════════════════════════════════════════════════
# SLIDE 14 — Notifications, Dashboards & Reports
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Notifications, Dashboards & Reports")

content_card(sl, Inches(0.8), Inches(1.8), Inches(3.8), Inches(5.0),
    "Notification System", [
        "In-app notification center",
        "Fires on every status change:",
        "  - Application decisions",
        "  - Verification results",
        "  - Task assignments & grading",
        "  - Supervisor reassignments",
        "Read/unread tracking",
        "90-day TTL auto-expiration",
        "Bell icon with unread count badge",
    ], LIGHT_BG)

content_card(sl, Inches(4.9), Inches(1.8), Inches(3.8), Inches(5.0),
    "Role Dashboards", [
        "Each role has a personalized dashboard",
        "Live stats cards with key metrics",
        "Student: applications, tasks, placements",
        "Company: internships, applications, interns",
        "University: students, placements, verifications",
        "Admin: users, verifications, system health",
        "Supervisor: assigned interns, tasks, messages",
        "FilterBar on every list/search page",
    ], LIGHT_BG)

content_card(sl, Inches(9.0), Inches(1.8), Inches(3.8), Inches(5.0),
    "Reports & Analytics", [
        "University placement/completion reports",
        "Company & admin analytics views",
        "Filterable report generation",
        "Export to PDF, Excel, CSV",
        "  (pdfkit + exceljs libraries)",
        "Interactive charts (recharts):",
        "  - Bar charts for summary metrics",
        "  - Pie charts for status breakdowns",
        "Lazy-loaded chart component (bundle split)",
    ], LIGHT_BG)

slide_number(sl, 14)

# ════════════════════════════════════════════════════════════
# SLIDE 15 — Frontend Architecture & UI Design
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Frontend Architecture & UI Design")

# File structure
tb = add_text_box(sl, Inches(0.8), Inches(1.6), Inches(5.5), Inches(5.5))
tf = tb.text_frame
tf.word_wrap = True
set_text(tf, "Frontend Structure (client/src/)", size=20, color=BLUE, bold=True)
add_para(tf, "", size=6)
structure = [
    "api/          — 14 API modules (axios-based)",
    "components/   — Shared UI: FilterBar, Navbar,",
    "                NotificationBell, ReportCharts,",
    "                ThemeToggle, PageHeader, Logo",
    "components/ui/ — Design system primitives:",
    "                Badge, Button, Card, Input,",
    "                Select, Spinner, Textarea",
    "context/      — AuthContext (JWT management)",
    "layouts/      — DashboardLayout (sidebar + header)",
    "pages/        — 7 public + 22 dashboard pages",
    "routes/       — ProtectedRoute, route guards",
    "lib/          — theme.js (dark/light mode)",
]
for s in structure:
    add_para(tf, s, size=12, color=DARK, space_before=Pt(3))

# Design language
tb2 = add_text_box(sl, Inches(6.8), Inches(1.6), Inches(5.8), Inches(5.5))
tf2 = tb2.text_frame
tf2.word_wrap = True
set_text(tf2, "UI Design Language", size=20, color=BLUE, bold=True)
add_para(tf2, "", size=6)
design = [
    "Modern, clean, minimalist aesthetic",
    "Inspired by Apple's Human Interface Guidelines",
    "Mobile-first, fully responsive design",
    "Glassmorphism: backdrop-blur, translucent panels",
    "Neutral palette + single blue accent color",
    "Soft rounded corners (8-16px), subtle shadows",
    "Smooth hover & transition animations",
    "respects prefers-reduced-motion",
    "Dark mode: OS-aware, localStorage persisted",
    "  global palette remap via .dark selectors",
    "Tailwind theme tokens for consistency",
    "All design tokens in tailwind.config.js",
]
for d in design:
    add_para(tf2, f"  {d}", size=12, color=DARK, space_before=Pt(3))

slide_number(sl, 15)

# ════════════════════════════════════════════════════════════
# SLIDE 16 — API & Backend Structure
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "API & Backend Structure")

tb = add_text_box(sl, Inches(0.8), Inches(1.6), Inches(5.5), Inches(5.5))
tf = tb.text_frame
tf.word_wrap = True
set_text(tf, "Backend Structure (server/)", size=20, color=BLUE, bold=True)
add_para(tf, "", size=6)
backend = [
    "index.js        — Express app entry point",
    "config/         — db.js, permissions.js",
    "models/         — 15 Mongoose models + barrel",
    "routes/         — 16 route files (RESTful)",
    "controllers/    — 17 controller files",
    "services/       — audit.js, notification.js",
    "middleware/     — auth, rbac, upload, errorHandler",
    "utils/          — jwt.js (token helpers)",
    "seed/           — seed.js (demo data)",
    "scripts/        — buildIndexes, syncSchema",
    "tests/          — integration.mjs (121 tests)",
]
for b in backend:
    add_para(tf, b, size=12, color=DARK, space_before=Pt(4))

# API routes
tb2 = add_text_box(sl, Inches(6.8), Inches(1.6), Inches(5.8), Inches(5.5))
tf2 = tb2.text_frame
tf2.word_wrap = True
set_text(tf2, "REST API Routes", size=20, color=BLUE, bold=True)
add_para(tf2, "", size=6)
routes = [
    "/api/auth      — Register, login, logout, credentials",
    "/api/students   — Profile, CV upload, portfolio",
    "/api/companies  — Company profile, supervisors",
    "/api/universities — University profile, verify students",
    "/api/internships — CRUD, search, filter, close",
    "/api/applications — Apply, track, review, verify",
    "/api/placements  — Manage, assign supervisor",
    "/api/tasks       — Assign, submit, grade, appeal",
    "/api/assessments — Request, submit, view",
    "/api/invitations — Send, accept, reject",
    "/api/verification — Entity verification + appeals",
    "/api/notifications — List, mark read",
    "/api/reports     — Generate, export PDF/Excel/CSV",
    "/api/audit       — View logs, compliance review",
    "/api/admin       — User management, system ops",
    "/api/dashboard   — Role-specific stats",
]
for r in routes:
    add_para(tf2, r, size=12, color=DARK, space_before=Pt(3))

slide_number(sl, 16)

# ════════════════════════════════════════════════════════════
# SLIDE 17 — Testing & Codebase Stats
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, WHITE)
slide_header(sl, "Testing & Key Codebase Statistics")

# Testing
content_card(sl, Inches(0.8), Inches(1.8), Inches(5.8), Inches(2.8),
    "Testing & Quality Assurance", [
        "Integration test suite: 121/121 tests passing (server/tests/integration.mjs)",
        "Tests cover auth, profiles, internships, applications, placements, tasks, assessments",
        "Seed script provides known-state reproducible dataset for testing",
        "npm run build — frontend regression gate on every phase",
        "Per-phase regression: all earlier happy paths re-tested before advancing",
    ], LIGHT_BG)

# Stats
content_card(sl, Inches(0.8), Inches(4.9), Inches(5.8), Inches(2.2),
    "Codebase at a Glance", [
        "15 MongoDB models  |  16 route files  |  17 controllers  |  14 API client modules",
        "29 React pages (7 public + 22 dashboard)  |  17+ shared components",
        "7 UI primitives (design system)  |  Full dark/light mode",
        "PDF, Excel, CSV report export  |  Interactive recharts analytics",
    ], LIGHT_BG)

# Project stats
content_card(sl, Inches(7.0), Inches(1.8), Inches(5.5), Inches(5.3),
    "Development Highlights", [
        "14 build phases (0-13) completed",
        "16 post-phase feature rounds merged",
        "Agile sprints with atomic commits",
        "Conventional commit messages",
        "Module-by-module vertical slices",
        "Backend-first per module (API > UI)",
        "Dependency-ordered build strategy",
        "Additive-first regression control",
        "Full traceability: FR > UC > Phase",
        "4 user roles + 2 sub-roles (supervisor, auditor)",
        "19 use cases implemented",
        "14 functional requirements fulfilled",
    ], ACCENT_BG)

slide_number(sl, 17)

# ════════════════════════════════════════════════════════════
# SLIDE 18 — Conclusion & Demo
# ════════════════════════════════════════════════════════════
sl = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(sl, BLUE)

add_rect(sl, 0, 0, SW, Inches(0.15), RGBColor(0x15, 0x30, 0x8A))

tb = add_text_box(sl, Inches(1.5), Inches(1.0), Inches(10), Inches(1.0))
set_text(tb.text_frame, "Conclusion", size=40, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)

# Summary points
card = add_rounded_rect(sl, Inches(1.5), Inches(2.2), Inches(10.3), Inches(3.2), RGBColor(0x1A, 0x36, 0x9E))
tb2 = add_text_box(sl, Inches(2.0), Inches(2.4), Inches(9.3), Inches(3.0))
tf2 = tb2.text_frame
tf2.word_wrap = True
conclusions = [
    "InternConnect successfully digitizes the complete internship management lifecycle",
    "All 14 functional requirements and 19 use cases have been implemented and tested",
    "The MERN stack provides a scalable, responsive, and maintainable foundation",
    "Role-based access and immutable audit logging ensure security and compliance",
    "The system connects students, companies, universities, supervisors, and administrators in one platform",
    "121 integration tests validate correctness across all core workflows",
]
first = True
for c in conclusions:
    if first:
        set_text(tf2, f"  {c}", size=16, color=WHITE)
        first = False
    else:
        add_para(tf2, f"  {c}", size=16, color=WHITE, space_before=Pt(10))

# Future work
tb3 = add_text_box(sl, Inches(1.5), Inches(5.7), Inches(5.0), Inches(1.5))
tf3 = tb3.text_frame
tf3.word_wrap = True
set_text(tf3, "Future Work (Phase 14)", size=18, color=RGBColor(0xBF, 0xDB, 0xFE), bold=True)
future = ["AWS S3 file storage", "Email (SendGrid) + SMS (Twilio)", "OAuth 2.0 + 2FA", "Redis caching", "Docker + cloud deployment"]
for f in future:
    add_para(tf3, f"  {f}", size=13, color=WHITE, space_before=Pt(3))

# Demo
tb4 = add_text_box(sl, Inches(7.5), Inches(5.7), Inches(4.5), Inches(1.5))
tf4 = tb4.text_frame
tf4.word_wrap = True
set_text(tf4, "Live Demo", size=24, color=WHITE, bold=True)
add_para(tf4, "npm run dev  (localhost:5173 + :5000)", size=14, color=RGBColor(0xBF, 0xDB, 0xFE), space_before=Pt(8))
add_para(tf4, "Thank you!", size=20, color=WHITE, bold=True, space_before=Pt(16))

slide_number(sl, 18)

# ── Save ──
output_path = "/home/abel/Innter-connect/InternConnect_Presentation.pptx"
prs.save(output_path)
print(f"Saved to {output_path}")
