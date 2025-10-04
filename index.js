import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import colors from "colors";
import { createServer } from "http";
import { createGraphQLServer, applyGraphQLMiddleware } from "./src/helper/graphql/graphqlServer.js";
import emailService from "./src/helper/mail/emailService.js";
import { setupSwagger } from "./src/helper/swagger/swaggerMiddleware.js";
import { registerRoutes } from "./src/routes/index.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

// Create HTTP server
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Setup Swagger documentation
setupSwagger(app);

// Register all routes
registerRoutes(app);

// Initialize servers
(async () => {
    try {
        // Initialize email service
        await emailService.initialize();
        
        // Create GraphQL server
        const graphqlServer = await createGraphQLServer(httpServer);
        
        // Apply GraphQL middleware
        applyGraphQLMiddleware(app, graphqlServer);
        
        // Start the server
        httpServer.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}`.green.underline.bold);
            console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`.blue.underline.bold);
            console.log(`REST API endpoint: http://localhost:${PORT}/`.yellow.underline.bold);
        });
    } catch (error) {
        console.log(`Error: ${error.message}`.red.bold);
    }
})();