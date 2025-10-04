import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

export const createGraphQLServer = async (httpServer) => {
  // Create Apollo Server instance
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: true, // Enable introspection for development
  });

  // Start the server
  await server.start();

  return server;
};

export const applyGraphQLMiddleware = (app, server) => {
  // Apply GraphQL middleware to Express app
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      // You can add authentication, user context, etc. here
      return {
        // Add any context you need for resolvers
        user: req.user || null,
        // Add database connections, etc.
      };
    },
  }));
};