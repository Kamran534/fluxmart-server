import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import colors from "colors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { createGraphQLServer, applyGraphQLMiddleware } from "./src/helper/graphql/graphqlServer.js";
import emailService from "./src/helper/mail/emailService.js";
import { setupSwagger } from "./src/helper/swagger/swaggerMiddleware.js";
import { registerRoutes } from "./src/routes/index.js";
import { connectDatabase, disconnectDatabase } from "./src/helper/db/index.js";
import { connectRedis, disconnectRedis } from "./src/helper/redis/index.js";
import { applyCors } from "./src/middlewares/cors.js";

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Security headers (allow Apollo landing page inline scripts)
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting (skip all /graphql requests)
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/graphql',
});
app.use(limiter);

// CORS (global + route-specific)
applyCors(app);

app.use(express.json());
app.use(morgan("dev"));

// Favicon handler to avoid 404s
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Setup Swagger documentation
setupSwagger(app);

// Register all routes
registerRoutes(app);

// Initialize servers
(async () => {
    try {
        await connectDatabase();
        await emailService.initialize();
        await connectRedis();
        const graphqlServer = await createGraphQLServer(httpServer);
        applyGraphQLMiddleware(app, graphqlServer);

        // 404 Not Found handler
        app.use((req, res) => {
          res.status(404).json({ success: false, message: "Resource not found", path: req.originalUrl });
        });

        // Centralized error handler
        // eslint-disable-next-line no-unused-vars
        app.use((err, req, res, next) => {
          const status = err.status || 500;
          const isProd = process.env.NODE_ENV === 'production';
          const payload = { success: false, message: err.message || 'Internal Server Error' };
          if (!isProd) payload.stack = err.stack;
          res.status(status).json(payload);
        });
        
        httpServer.listen(PORT, () => {
            console.log(` Server is running `.bgGreen.black.bold, `${`http://localhost:${PORT}`.underline}`.green.bold);
            console.log(` GraphQL endpoint `.bgBlue.white.bold, `${`http://localhost:${PORT}/graphql`.underline}`.blue.bold);
            console.log(` REST API endpoint `.bgYellow.black.bold, `${`http://localhost:${PORT}/`.underline}`.yellow.bold);
            console.log(` Swagger UI `.bgMagenta.white.bold, `${`http://localhost:${PORT}/api-docs`.underline}`.magenta.bold);
        });

        const shutdown = async (signal) => {
            console.log(`\n${signal} received, shutting down...`.yellow.bold);
            try {
                httpServer.close(() => { console.log('HTTP server closed'.yellow); });
                await disconnectRedis();
                await disconnectDatabase();
            } catch (err) {
                console.log(`Shutdown error: ${err.message}`.red.bold);
            } finally {
                process.exit(0);
            }
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        console.log(`Error: ${error.message}`.red.bold);
    }
})();