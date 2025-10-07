import healthRouter from './health.js';
import profileRouter from './profile.js';

/**
 * Route registration function
 * @param {Express} app - Express application instance
 */
export const registerRoutes = (app) => {
  // Health routes
  app.use('/', healthRouter);
  
  // Profile image (proxy + upload) routes
  app.use('/api', profileRouter);

};

export { healthRouter, profileRouter  };
