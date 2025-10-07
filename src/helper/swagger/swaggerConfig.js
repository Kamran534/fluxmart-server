import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const port = process.env.PORT || 8080;
const localServerUrl = process.env.SWAGGER_SERVER_LOCAL || `http://localhost:${port}`;
const prodServerUrl = process.env.SWAGGER_SERVER_PROD || null;

const servers = [
  {
    url: localServerUrl,
    description: 'Local Development Server'
  },
  // Only include production server if provided via env
  ...(prodServerUrl ? [{ url: prodServerUrl, description: 'Production Server (Live)' }] : [])
];

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
    servers,
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
      { name: 'Profile Images', description: 'Profile image upload and viewing endpoints' }
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

// Post-process: remove unwanted sections
try {
  // Remove Email and GraphQL tags if present
  if (Array.isArray(specs.tags)) {
    specs.tags = specs.tags.filter((t) => t?.name !== 'Email' && t?.name !== 'GraphQL');
  }
  // Remove specific paths
  if (specs.paths) {
    delete specs.paths['/test-email'];
  }
} catch (_) {}

export { swaggerUi, specs };
