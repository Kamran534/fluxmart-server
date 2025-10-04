import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FluxMart Server API',
      version: '1.0.0',
      description: 'AI Powered Ecommerce Application Server API Documentation',
      contact: {
        name: 'Muhammad Kamran',
        email: 'kamran534055@gmail.com',
        url: 'https://portfolio-three-hazel-39.vercel.app/'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Local Development Server'
      },
      {
        url: 'https://api.fluxmart.com',
        description: 'Production Server (Live)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success message' }
          }
        }
      }
    },
    tags: [
      { name: 'Health', description: 'Server health and status endpoints' },
      { name: 'Email', description: 'Email service endpoints' },
      { name: 'GraphQL', description: 'GraphQL API endpoints' }
    ],
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './index.js'
  ]
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
