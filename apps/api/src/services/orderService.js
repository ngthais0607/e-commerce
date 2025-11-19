import { prisma } from '../../prisma/client.js';

export class OrderService {
  static async getAllOrders(filters = {}) {
    const {
      page = 1,
      pageSize = 20,
      status,
      userId,
      paymentStatus,
    } = filters;

    const where = {
      ...(status && { status }),
      ...(userId && { userId }),
      ...(paymentStatus && { paymentStatus }),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getOrderById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        coupon: true,
      },
    });
  }

  static async createOrder(orderData) {
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

    // Calculate totals
    let subtotal = 0;
    let discount = 0;

    // Get products and calculate subtotal
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new Error('Some products not found or inactive');
    }

    // Check stock and calculate subtotal
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
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

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
          
          // Ensure discount doesn't exceed subtotal
          discount = Math.min(discount, subtotal);

          // Update coupon usage
          await prisma.coupon.update({
            where: { code: couponCode },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    const total = subtotal + shippingFee - discount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        shippingAddress,
        phone,
        email,
        notes,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        status: 'PENDING',
        subtotal,
        shippingFee,
        discount,
        total,
        couponCode: discount > 0 ? couponCode : null,
        items: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const price = Number(product?.salePrice || product?.price || 0);
            return {
              productId: item.productId,
              name: product?.name || '',
              price,
              quantity: item.quantity,
              attributes: item.attributes || null,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return order;
  }

  static async updateOrderStatus(id, statusData) {
    const { status, paymentStatus, trackingCode } = statusData;

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingCode !== undefined) updateData.trackingCode = trackingCode;

    return prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  static async getUserOrders(userId, filters = {}) {
    const { page = 1, pageSize = 20, status } = filters;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

