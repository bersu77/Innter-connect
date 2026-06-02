import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Local-disk file upload (PKG_03). Cloud storage (AWS S3) arrives in Phase 14.
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

// Documents (CV, reports) plus common task-deliverable file types.
const ALLOWED = [
  '.pdf', '.doc', '.docx', '.txt',
  '.ppt', '.pptx', '.xls', '.xlsx',
  '.png', '.jpg', '.jpeg', '.zip',
];
const fileFilter = (_req, file, cb) => {
  cb(null, ALLOWED.includes(path.extname(file.originalname).toLowerCase()));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
