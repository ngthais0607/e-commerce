import express from 'express';
import * as uploadController from '../../controllers/admin/upload.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { uploadMultiple, uploadSingle } from '../../middleware/upload.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

/**
 * @swagger
 * /api/admin/upload/images:
 *   post:
 *     summary: Upload multiple product images
 *     tags: [Admin - Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: No files or invalid files
 *       401:
 *         description: Unauthorized
 */
router.post('/images', uploadMultiple('images', 10), uploadController.uploadImages);

/**
 * @swagger
 * /api/admin/upload/image:
 *   post:
 *     summary: Upload single product image
 *     tags: [Admin - Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No file or invalid file
 *       401:
 *         description: Unauthorized
 */
router.post('/image', uploadSingle('image'), uploadController.uploadImage);

export default router;

