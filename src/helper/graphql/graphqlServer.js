import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import depthLimit from 'graphql-depth-limit';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

export const createGraphQLServer = async (httpServer) => {
  const isProd = process.env.NODE_ENV === 'production';
  const maxDepth = Number(process.env.GRAPHQL_MAX_DEPTH || 8);

  const plugins = [ApolloServerPluginDrainHttpServer({ httpServer })];
  if (!isProd) {
    plugins.push(ApolloServerPluginLandingPageLocalDefault({ embed: true }));
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins,
    introspection: !isProd,
    validationRules: [depthLimit(maxDepth)],
  });

  await server.start();
  return server;
};

export const applyGraphQLMiddleware = (app, server) => {
  // Handle both GET (landing page in non-prod) and POST (queries) on /graphql
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({
      user: req.user || null,
    }),
  }));
};