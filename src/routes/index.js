import healthRouter from './health.js';
import emailRouter from './email.js';
import graphqlRouter from './graphql.js';

/**
 * Route registration function
 * @param {Express} app - Express application instance
 */
export const registerRoutes = (app) => {
  // Health routes
  app.use('/', healthRouter);
  
  // Email routes
  app.use('/', emailRouter);
  
  // GraphQL routes (documentation only)
  app.use('/', graphqlRouter);
};

export { healthRouter, emailRouter, graphqlRouter };
