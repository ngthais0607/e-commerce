import { prisma } from '../../prisma/client.js';

export const getWishlist = async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const productId = parseInt(req.body.productId, 10);

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Product already in wishlist' });
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId: req.user.id,
        productId,
      },
      include: {
        product: true,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }
    next(error);
  }
};

