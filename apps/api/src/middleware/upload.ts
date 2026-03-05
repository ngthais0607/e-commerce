import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only ${allowedMimes.join(', ')} are allowed.`
      ),
      false
    );
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10, // Max 10 files
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName = 'image') => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'File too large',
              message: 'Maximum file size is 5MB',
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              error: 'Too many files',
              message: 'Maximum 10 files allowed',
            });
          }
        }
        return res.status(400).json({
          error: 'Upload error',
          message: err.message,
        });
      }
      next();
    });
  };
};

// Middleware for multiple files upload
export const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'File too large',
              message: 'Maximum file size is 5MB',
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              error: 'Too many files',
              message: `Maximum ${maxCount} files allowed`,
            });
          }
        }
        return res.status(400).json({
          error: 'Upload error',
          message: err.message,
        });
      }
      next();
    });
  };
};

// Get file URL helper
export const getFileUrl = (filename) => {
  if (!filename) return null;
  // In production, this should return CDN URL
  // For now, return relative path
  return `/uploads/${filename}`;
};

// Get multiple file URLs
export const getFileUrls = (files) => {
  if (!files || files.length === 0) return [];
  return files.map((file) => getFileUrl(file.filename));
};

