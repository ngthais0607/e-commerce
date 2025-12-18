import { query, queryOne, insert, execute, beginTransaction, commit, rollback } from '../../config/database.js';

export const adminOrderModel = {
  async list(filters = {}) {
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

    // Get orders with user and items
    // Use template for LIMIT/OFFSET to avoid parameter binding issues
    const limitValue = parseInt(String(pageSize), 10);
    const offsetValue = parseInt(String((page - 1) * pageSize), 10);
    
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
              images: typeof item.product_images === 'string' ? JSON.parse(item.product_images) : item.product_images,
            } : null,
          })),
          coupon: coupon,
        };
      })
    );

    return {
      items: ordersWithItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getById(id) {
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

  async create(orderData) {
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
      const [products] = await connection.execute(
        `SELECT * FROM products WHERE id IN (${placeholders}) AND isActive = 1`,
        productIds
      );

      if (products.length !== productIds.length) {
        throw new Error('Some products not found or inactive');
      }

      // Calculate subtotal and validate stock
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
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
        const coupon = couponRows[0];

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
      const orderId = orderResult.insertId;

      // Create order items and update product stock
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
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

  async updateStatus(id, statusData) {
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

  async listByUser(userId, filters = {}) {
    const { page = 1, pageSize = 20, status } = filters;

    let whereClause = 'WHERE o.clientId = ?';
    const params = [userId];

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

    // Get orders with items
    // Use template for LIMIT/OFFSET to avoid parameter binding issues
    const limitValue = parseInt(String(pageSize), 10);
    const offsetValue = parseInt(String((page - 1) * pageSize), 10);
    
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
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};
