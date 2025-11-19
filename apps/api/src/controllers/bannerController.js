import { prisma } from '../../prisma/client.js';
import { z } from 'zod';

const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    image: z.string().url(),
    link: z.string().url().optional(),
    position: z.string().default('homepage'),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  }),
});

export const getBanners = async (req, res, next) => {
  try {
    const position = req.query.position;
    const includeInactive = req.user?.role === 'ADMIN';

    const banners = await prisma.banner.findMany({
      where: {
        ...(position && { position }),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(banners);
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const data = createBannerSchema.parse({ body: req.body }).body;

    const banner = await prisma.banner.create({ data });
    res.status(201).json(banner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = createBannerSchema.partial().parse({ body: req.body }).body;

    const banner = await prisma.banner.update({
      where: { id },
      data,
    });

    res.json(banner);
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.banner.delete({ where: { id } });
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};

