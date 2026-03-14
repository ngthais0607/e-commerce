import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { log } from './logger.js';

const uploadsDir = path.join(process.cwd(), 'uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

// Create thumbnails directory if it doesn't exist
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

export interface ProcessImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  createThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ImageConstraints {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

/**
 * Process and optimize image
 */
export const processImage = async (
  filePath: string,
  options: ProcessImageOptions = {}
): Promise<{ original: string; processed: string; thumbnail: string | null; filename: string; thumbnailFilename: string | null }> => {
  const {
    width = 1200,
    height = 1200,
    quality = 85,
    createThumbnail = true,
    thumbnailSize = 300,
  } = options;

  try {
    const filename = path.basename(filePath);
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);

    // Process main image
    const processedPath = path.join(uploadsDir, `${name}-processed${ext}`);
    await sharp(filePath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toFile(processedPath);

    // Create thumbnail if requested
    let thumbnailPath = null;
    if (createThumbnail) {
      thumbnailPath = path.join(thumbnailsDir, `${name}-thumb${ext}`);
      await sharp(filePath)
        .resize(thumbnailSize, thumbnailSize, {
          fit: 'cover',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    }

    // Delete original file
    fs.unlinkSync(filePath);

    return {
      original: filePath,
      processed: processedPath,
      thumbnail: thumbnailPath,
      filename: `${name}-processed${ext}`,
      thumbnailFilename: thumbnailPath ? `${name}-thumb${ext}` : null,
    };
  } catch (error) {
    log.error('Image processing error', error instanceof Error ? error : new Error(String(error)), { filePath });
    throw new Error('Failed to process image');
  }
};

/**
 * Process multiple images
 */
export const processImages = async (
  files: Array<{ path: string }>,
  options: ProcessImageOptions = {}
) => {
  const results = await Promise.all(
    files.map((file: { path: string }) => processImage(file.path, options))
  );
  return results;
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = async (
  filePath: string,
  constraints: ImageConstraints = {}
): Promise<boolean> => {
  const { minWidth, minHeight, maxWidth, maxHeight, aspectRatio } = constraints;

  try {
    const metadata = await sharp(filePath).metadata();

    if (minWidth && metadata.width != null && metadata.width < minWidth) {
      return false;
    }
    if (minHeight && metadata.height != null && metadata.height < minHeight) {
      return false;
    }
    if (maxWidth && metadata.width != null && metadata.width > maxWidth) {
      return false;
    }
    if (maxHeight && metadata.height != null && metadata.height > maxHeight) {
      return false;
    }
    if (aspectRatio && metadata.width != null && metadata.height != null) {
      const currentRatio = metadata.width / metadata.height;
      const tolerance = 0.1; // 10% tolerance
      if (
        Math.abs(currentRatio - aspectRatio) >
        aspectRatio * tolerance
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    log.error('Image validation error', error instanceof Error ? error : new Error(String(error)), { filePath });
    return false;
  }
};

/**
 * Delete image files
 */
export const deleteImage = (filename: string): void => {
  try {
    const filePath = path.join(uploadsDir, filename);
    const thumbPath = path.join(thumbnailsDir, filename.replace(/-processed/, '-thumb'));

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }
  } catch (error) {
    log.error('Image deletion error', error instanceof Error ? error : new Error(String(error)), { filename });
  }
};

