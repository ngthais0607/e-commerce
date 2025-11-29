import { wishlistModel } from '../../models/user/wishlist.model.js';
import { wishlistView } from '../../views/user/wishlist.view.js';
import { prisma } from '../../../prisma/client.js';

export const getWishlist = async (req, res, next) => {
  try {
    const items = await wishlistModel.list(req.user.id);
    res.json(wishlistView.list(items));
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

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existing = await wishlistModel.find(req.user.id, productId);
    if (existing) {
      return res.status(409).json({ error: 'Product already in wishlist' });
    }

    const item = await wishlistModel.add(req.user.id, productId);
    res.status(201).json(wishlistView.detail(item));
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    await wishlistModel.remove(req.user.id, productId);
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }
    next(error);
  }
};


