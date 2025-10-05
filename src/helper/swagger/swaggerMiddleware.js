import { swaggerUi, specs } from './swaggerConfig.js';

/**
 * Setup Swagger UI middleware
 * @param {Express} app - Express application instance
 */
export const setupSwagger = (app) => {
  // Swagger UI options - Standard appearance
  const swaggerOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: (req) => {
        // Add any custom headers or modifications here
        return req;
      },
      responseInterceptor: (res) => {
        // Add any response modifications here
        return res;
      }
    }
  };

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

  // Serve Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Redirect root API docs to Swagger UI
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  // const port = process.env.PORT || 8080;
  // console.log('Swagger documentation available at:'.blue.bold);
  // console.log(`  - UI: http://localhost:${port}/api-docs`.blue.underline.bold);
  // console.log(`  - JSON: http://localhost:${port}/api-docs.json`.blue.underline.bold);
  // console.log(`  - Docs: http://localhost:${port}/docs`.blue.underline.bold);
  
  // console.log('\nAvailable server options:'.yellow.bold);
  // console.log(`  - Local Development: http://localhost:${port}`.cyan);
  // console.log('  - Production (Live): https://api.fluxmart.com'.green);
};

export default setupSwagger;
