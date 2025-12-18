import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stay API',
      version: '1.0.0',
      description: 'Full-stack e-commerce application API documentation',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Validation error details',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items',
            },
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            pageSize: {
              type: 'integer',
              description: 'Number of items per page',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            name: {
              type: 'string',
            },
            phone: {
              type: 'string',
              nullable: true,
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'ADMIN', 'STAFF'],
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            slug: {
              type: 'string',
            },
            shortDesc: {
              type: 'string',
              nullable: true,
            },
            description: {
              type: 'string',
              nullable: true,
            },
            price: {
              type: 'number',
              format: 'decimal',
            },
            salePrice: {
              type: 'number',
              format: 'decimal',
              nullable: true,
            },
            stock: {
              type: 'integer',
            },
            sku: {
              type: 'string',
              nullable: true,
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            attributes: {
              type: 'object',
              nullable: true,
            },
            categoryId: {
              type: 'integer',
            },
            brand: {
              type: 'string',
              nullable: true,
            },
            rating: {
              type: 'number',
              format: 'decimal',
            },
            reviewCount: {
              type: 'integer',
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            orderNumber: {
              type: 'string',
            },
            userId: {
              type: 'integer',
            },
            shippingAddress: {
              type: 'object',
            },
            phone: {
              type: 'string',
            },
            email: {
              type: 'string',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'],
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
            },
            subtotal: {
              type: 'number',
              format: 'decimal',
            },
            shippingFee: {
              type: 'number',
              format: 'decimal',
            },
            discount: {
              type: 'number',
              format: 'decimal',
            },
            total: {
              type: 'number',
              format: 'decimal',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/**/*.js', './index.js'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);

