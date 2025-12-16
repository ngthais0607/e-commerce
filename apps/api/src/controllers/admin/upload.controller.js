import { uploadMultiple, getFileUrls } from '../../middleware/upload.js';
import { processImages } from '../../utils/imageProcessor.js';
import { log } from '../../utils/logger.js';

/**
 * Upload product images
 * POST /api/admin/upload/images
 */
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one image file',
      });
    }

    // Process images (resize, optimize, create thumbnails)
    const processedImages = await processImages(req.files, {
      width: 1200,
      height: 1200,
      quality: 85,
      createThumbnail: true,
      thumbnailSize: 300,
    });

    // Get URLs for processed images
    const imageUrls = processedImages.map((img) => ({
      original: getFileUrls([{ filename: img.filename }])[0],
      thumbnail: img.thumbnailFilename
        ? getFileUrls([{ filename: img.thumbnailFilename }])[0]
        : null,
      filename: img.filename,
    }));

    log.info('Images uploaded successfully', {
      count: imageUrls.length,
      userId: req.user?.id,
    });

    res.status(200).json({
      message: 'Images uploaded successfully',
      images: imageUrls,
    });
  } catch (error) {
    log.error('Image upload error', error);
    next(error);
  }
};

/**
 * Upload single image
 * POST /api/admin/upload/image
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select an image file',
      });
    }

    // Process image
    const processedImage = await processImages([req.file], {
      width: 1200,
      height: 1200,
      quality: 85,
      createThumbnail: true,
      thumbnailSize: 300,
    });

    const imageUrl = {
      original: getFileUrls([{ filename: processedImage[0].filename }])[0],
      thumbnail: processedImage[0].thumbnailFilename
        ? getFileUrls([{ filename: processedImage[0].thumbnailFilename }])[0]
        : null,
      filename: processedImage[0].filename,
    };

    log.info('Image uploaded successfully', {
      filename: imageUrl.filename,
      userId: req.user?.id,
    });

    res.status(200).json({
      message: 'Image uploaded successfully',
      image: imageUrl,
    });
  } catch (error) {
    log.error('Image upload error', error);
    next(error);
  }
};

