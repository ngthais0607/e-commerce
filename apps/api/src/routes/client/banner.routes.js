import express from 'express';
import * as bannerController from '../../controllers/client/banner.controller.js';

const router = express.Router();

router.get('/', bannerController.getBanners);

export default router;


