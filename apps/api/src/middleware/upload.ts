import type { Request, Response, NextFunction } from 'express';
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
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadsDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
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
    (cb as (err: Error | null, accept?: boolean) => void)(
      new Error(`Invalid file type. Only ${allowedMimes.join(', ')} are allowed.`),
      false
    );
  }
};

// Multer configuration (body/upload size limits to avoid oversized requests)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 10;

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName = 'image') => {
  return (req: Request, res: Response, next: NextFunction): void => {
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
  return (req: Request, res: Response, next: NextFunction): void => {
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
export const getFileUrl = (filename: string | undefined | null): string | null => {
  if (!filename) return null;
  return `/uploads/${filename}`;
};

// Get multiple file URLs
export const getFileUrls = (
  files: Array<{ filename?: string }> | undefined | null
): (string | null)[] => {
  if (!files || files.length === 0) return [];
  return files.map((file: { filename?: string }) => getFileUrl(file.filename));
};

