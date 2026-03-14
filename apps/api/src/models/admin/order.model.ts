import type { OrderListFilters, OrderCreateData } from '../../types/models.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute, beginTransaction, commit, rollback } from '../../config/database.js';

export const adminOrderModel = {
  async list(filters: OrderListFilters = {}) {
    const {
      page = 1,
      pageSize = 20,
      status,
      userId,
      paymentStatus,
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }
    if (userId) {
      whereClause += ' AND o.clientId = ?';
      params.push(userId);
    }
    if (paymentStatus) {
      whereClause += ' AND o.paymentStatus = ?';
      params.push(paymentStatus);
    }

    // Get total count
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const total = totalResult.total;

    const MAX_PAGE_SIZE = 100;
    const limitValue = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(String(pageSize), 10) || 20));
    const offsetValue = Math.max(0, (parseInt(String(page), 10) || 1) - 1) * limitValue;

    const orders = await query(
      `SELECT 
        o.*,
        c.id as user_id,
        c.name as user_name,
        c.email as user_email
      FROM orders o
      LEFT JOIN clients c ON o.clientId = c.id
      ${whereClause}
      ORDER BY o.createdAt DESC
      LIMIT ${limitValue} OFFSET ${offsetValue}`,
      params
    );

    if (orders.length === 0) {
      return {
        items: [],
        total,
        page: Math.max(1, parseInt(String(page), 10) || 1),
        pageSize: limitValue,
        totalPages: Math.ceil(total / limitValue),
      };
    }

    const orderIds = orders.map((o) => o.id);
    const placeholders = orderIds.map(() => '?').join(',');

    // Batch load all order items for this page (avoids N+1)
    const allItems = await query(
      `SELECT 
        oi.*,
        p.id as product_id,
        p.name as product_name,
        p.images as product_images
      FROM order_items oi
      LEFT JOIN products p ON oi.productId = p.id
      WHERE oi.orderId IN (${placeholders})
      ORDER BY oi.orderId, oi.id`,
      orderIds
    );

    const couponCodes = [...new Set(orders.map((o) => o.couponCode).filter(Boolean))];
    const couponsByCode = new Map();
    if (couponCodes.length > 0) {
      const couponPlaceholders = couponCodes.map(() => '?').join(',');
      const coupons = await query(
        `SELECT * FROM coupons WHERE code IN (${couponPlaceholders})`,
        couponCodes
      );
      for (const c of coupons) {
        couponsByCode.set(c.code, c);
      }
    }

    const itemsByOrderId = new Map();
    for (const item of allItems) {
      const list = itemsByOrderId.get(item.orderId) || [];
      list.push(item);
      itemsByOrderId.set(item.orderId, list);
    }

    const mapItem = (item: Record<string, unknown>) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      name: item.name,
      price: parseFloat(String(item.price ?? 0)),
      quantity: item.quantity,
      attributes: item.attributes ? (typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product: item.product_id ? {
        id: item.product_id,
        name: item.product_name,
        images: typeof item.product_images === 'string' ? JSON.parse(item.product_images) : item.product_images,
      } : null,
    });

    const ordersWithItems = orders.map((order) => {
      const items = (itemsByOrderId.get(order.id) || []).map(mapItem);
      const coupon = order.couponCode ? couponsByCode.get(order.couponCode) ?? null : null;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        clientId: order.clientId,
        shippingAddress: typeof order.shippingAddress === 'string'
          ? JSON.parse(order.shippingAddress)
          : order.shippingAddress,
        phone: order.phone,
        email: order.email,
        notes: order.notes,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: parseFloat(order.subtotal),
        shippingFee: parseFloat(order.shippingFee),
        discount: parseFloat(order.discount),
        total: parseFloat(order.total),
        couponCode: order.couponCode,
        trackingCode: order.trackingCode,
        internalNotes: order.internalNotes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: order.user_id ? {
          id: order.user_id,
          name: order.user_name,
          email: order.user_email,
        } : null,
        items,
        coupon,
      };
    });

    return {
      items: ordersWithItems,
      total,
      page: Math.max(1, parseInt(String(page), 10) || 1),
      pageSize: limitValue,
      totalPages: Math.ceil(total / limitValue),
    };
  },

  async getById(id: number) {
    const order = await queryOne(
      `SELECT 
        o.*,
        c.id as user_id,
        c.name as user_name,
        c.email as user_email,
        c.phone as user_phone
      FROM orders o
      LEFT JOIN clients c ON o.clientId = c.id
      WHERE o.id = ?`,
      [id]
    );

    if (!order) return null;

    // Get order items
    const items = await query(
      `SELECT 
        oi.*,
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.images as product_images
      FROM order_items oi
      LEFT JOIN products p ON oi.productId = p.id
      WHERE oi.orderId = ?`,
      [id]
    );

    const coupon = order.couponCode ? await queryOne(
      `SELECT * FROM coupons WHERE code = ?`,
      [order.couponCode]
    ) : null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      clientId: order.clientId,
      shippingAddress: typeof order.shippingAddress === 'string' 
        ? JSON.parse(order.shippingAddress) 
        : order.shippingAddress,
      phone: order.phone,
      email: order.email,
      notes: order.notes,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: parseFloat(order.subtotal),
      shippingFee: parseFloat(order.shippingFee),
      discount: parseFloat(order.discount),
      total: parseFloat(order.total),
      couponCode: order.couponCode,
      trackingCode: order.trackingCode,
      internalNotes: order.internalNotes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user_id ? {
        id: order.user_id,
        name: order.user_name,
        email: order.user_email,
        phone: order.user_phone,
      } : null,
      items: items.map(item => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        name: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity,
        attributes: item.attributes ? (typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes) : null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: item.product_id ? {
          id: item.product_id,
          name: item.product_name,
          slug: item.product_slug,
          images: typeof item.product_images === 'string' ? JSON.parse(item.product_images) : item.product_images,
        } : null,
      })),
      coupon: coupon,
    };
  },

  async create(orderData: OrderCreateData) {
    const connection = await beginTransaction();
    try {
      const {
        userId,
        items,
        shippingAddress,
        phone,
        email,
        notes,
        paymentMethod,
        couponCode,
        shippingFee = 0,
      } = orderData;

      let subtotal = 0;
      let discount = 0;

      // Get products
      const productIds = items.map((item) => item.productId);
      const placeholders = productIds.map(() => '?').join(',');
      const [productsRows] = await connection.execute(
        `SELECT * FROM products WHERE id IN (${placeholders}) AND isActive = 1`,
        productIds
      );
      const products = productsRows as RowDataPacket[];

      if (products.length !== productIds.length) {
        throw new Error('Some products not found or inactive');
      }

      // Calculate subtotal and validate stock
      for (const item of items) {
        const product = products.find((p: RowDataPacket) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const price = Number(product.salePrice || product.price);
        subtotal += price * item.quantity;
      }

      // Apply coupon if provided
      if (couponCode) {
        const [couponRows] = await connection.execute(
          `SELECT * FROM coupons WHERE code = ?`,
          [couponCode]
        );
        const couponList = couponRows as RowDataPacket[];
        const coupon = couponList[0];

        if (coupon && coupon.isActive) {
          const now = new Date();
          if (
            new Date(coupon.validFrom) <= now &&
            new Date(coupon.validUntil) >= now &&
            (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)
          ) {
            if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
              throw new Error(`Minimum order amount of ${coupon.minOrderAmount} required`);
            }

            if (coupon.type === 'PERCENT') {
              discount = (subtotal * Number(coupon.value)) / 100;
              if (coupon.maxDiscount) {
                discount = Math.min(discount, Number(coupon.maxDiscount));
              }
            } else {
              discount = Number(coupon.value);
            }

            discount = Math.min(discount, subtotal);

            // Update coupon used count
            await connection.execute(
              `UPDATE coupons SET usedCount = usedCount + 1, updatedAt = NOW() WHERE code = ?`,
              [couponCode]
            );
          }
        }
      }

      const total = subtotal + shippingFee - discount;
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          orderNumber, clientId, shippingAddress, phone, email, notes,
          status, paymentMethod, paymentStatus, subtotal, shippingFee,
          discount, total, couponCode, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, 'PENDING', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderNumber,
          userId,
          JSON.stringify(shippingAddress),
          phone,
          email || null,
          notes || null,
          paymentMethod,
          subtotal,
          shippingFee,
          discount,
          total,
          discount > 0 ? couponCode : null,
        ]
      );
      const orderId = (orderResult as ResultSetHeader).insertId;

      // Auto-save shipping address to addresses table if it doesn't exist
      try {
        if (shippingAddress && shippingAddress.name && shippingAddress.address) {
          // Check if address already exists for this user
          const [existingAddressesRows] = await connection.execute(
            `SELECT * FROM addresses 
             WHERE clientId = ? 
             AND name = ? 
             AND phone = ? 
             AND address = ? 
             AND city = ? 
             AND district = ? 
             AND ward = ?`,
            [
              userId,
              shippingAddress.name,
              shippingAddress.phone || phone,
              shippingAddress.address,
              shippingAddress.city,
              shippingAddress.district,
              shippingAddress.ward,
            ]
          );
          const existingAddresses = existingAddressesRows as RowDataPacket[];

          // If address doesn't exist, create it
          if (!existingAddresses || existingAddresses.length === 0) {
            await connection.execute(
              `INSERT INTO addresses (clientId, name, phone, address, city, district, ward, postalCode, isDefault, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
              [
                userId,
                shippingAddress.name,
                shippingAddress.phone || phone,
                shippingAddress.address,
                shippingAddress.city,
                shippingAddress.district,
                shippingAddress.ward,
                shippingAddress.postalCode || null,
              ]
            );
          }
        }
      } catch (addressError) {
        // Log but don't fail the order creation if address save fails
        console.error('Failed to save address to addresses table:', addressError);
      }

      // Create order items and update product stock
      for (const item of items) {
        const product = products.find((p: RowDataPacket) => p.id === item.productId);
        const price = Number(product?.salePrice || product?.price || 0);

        await connection.execute(
          `INSERT INTO order_items (orderId, productId, name, price, quantity, attributes, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            orderId,
            item.productId,
            product?.name || '',
            price,
            item.quantity,
            item.attributes ? JSON.stringify(item.attributes) : null,
          ]
        );

        // Update product stock
        await connection.execute(
          `UPDATE products SET stock = stock - ?, updatedAt = NOW() WHERE id = ?`,
          [item.quantity, item.productId]
        );
      }

      await commit(connection);

      // Return full order with relations
      return this.getById(orderId);
    } catch (error) {
      await rollback(connection);
      throw error;
    }
  },

  async updateStatus(id: number, statusData: Record<string, unknown>) {
    const { status, paymentStatus, trackingCode } = statusData;
    const updateFields = [];
    const updateValues = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (paymentStatus) {
      updateFields.push('paymentStatus = ?');
      updateValues.push(paymentStatus);
    }
    if (trackingCode !== undefined) {
      updateFields.push('trackingCode = ?');
      updateValues.push(trackingCode);
    }

    if (updateFields.length > 0) {
      updateFields.push('updatedAt = NOW()');
      updateValues.push(id);

      await execute(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    return this.getById(id);
  },

  async listByUser(userId: number, filters: OrderListFilters = {}) {
    const { page = 1, pageSize = 20, status } = filters;

    let whereClause = 'WHERE o.clientId = ?';
    const params: (string | number)[] = [userId];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    // Get total count
    const [totalResult] = await query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const total = totalResult.total;

    const MAX_PAGE_SIZE = 100;
    const limitValue = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(String(pageSize), 10) || 20));
    const offsetValue = Math.max(0, (parseInt(String(page), 10) || 1) - 1) * limitValue;

    const orders = await query(
      `SELECT * FROM orders o ${whereClause} ORDER BY o.createdAt DESC LIMIT ${limitValue} OFFSET ${offsetValue}`,
      params
    );

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await query(
          `SELECT 
            oi.*,
            p.id as product_id,
            p.name as product_name,
            p.images as product_images
          FROM order_items oi
          LEFT JOIN products p ON oi.productId = p.id
          WHERE oi.orderId = ?`,
          [order.id]
        );

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          clientId: order.clientId,
          shippingAddress: typeof order.shippingAddress === 'string' 
            ? JSON.parse(order.shippingAddress) 
            : order.shippingAddress,
          phone: order.phone,
          email: order.email,
          notes: order.notes,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          subtotal: parseFloat(order.subtotal),
          shippingFee: parseFloat(order.shippingFee),
          discount: parseFloat(order.discount),
          total: parseFloat(order.total),
          couponCode: order.couponCode,
          trackingCode: order.trackingCode,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: items.map(item => ({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            name: item.name,
            price: parseFloat(item.price),
            quantity: item.quantity,
            attributes: item.attributes ? (typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes) : null,
            createdAt: item.createdAt,
            product: item.product_id ? {
              id: item.product_id,
              name: item.product_name,
              images: typeof item.product_images === 'string' ? JSON.parse(item.product_images) : item.product_images,
            } : null,
          })),
        };
      })
    );

    return {
      items: ordersWithItems,
      total,
      page: Math.max(1, parseInt(String(page), 10) || 1),
      pageSize: limitValue,
      totalPages: Math.ceil(total / limitValue),
    };
  },
};
