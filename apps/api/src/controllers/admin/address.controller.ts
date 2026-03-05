import type { Request, Response, NextFunction } from 'express';
import { addressModel } from '../../models/client/address.model.js';
import { addressView } from '../../views/client/address.view.js';

export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    
    let addresses;
    if (userId) {
      const userIdNum = parseInt(String(userId), 10);
      if (Number.isNaN(userIdNum)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      addresses = await addressModel.listByUser(userIdNum);
    } else {
      // Get all addresses
      addresses = await addressModel.listAll();
    }
    
    // Ensure we return an array
    const result = addressView.list(addresses || []);
    res.json(Array.isArray(result) ? result : []);
  } catch (error) {
    next(error);
  }
};

export const getUserAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const addresses = await addressModel.listByUser(userId);
    res.json(addressView.list(addresses));
  } catch (error) {
    next(error);
  }
};

export const getAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid address ID' });
    }
    
    const address = await addressModel.findById(id);
    
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    res.json(addressView.detail(address));
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid address ID' });
    }
    
    const address = await addressModel.findById(id);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    const deleted = await addressModel.remove(id);
    
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete address' });
    }
    
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
};

