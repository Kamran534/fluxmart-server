import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import depthLimit from 'graphql-depth-limit';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import jwt from 'jsonwebtoken';

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
    context: async ({ req }) => {
      const rawAuth = (req.headers['authorization'] || req.headers['x-access-token'] || '').toString();
      const bearerMatch = rawAuth.match(/^Bearer\s+(.*)$/i);
      let token = bearerMatch ? bearerMatch[1] : rawAuth;
      if (!token && req.headers.cookie) {
        const cookies = Object.fromEntries(req.headers.cookie.split(';').map(p => {
          const i = p.indexOf('=');
          const k = p.slice(0, i).trim();
          const v = decodeURIComponent(p.slice(i + 1));
          return [k, v];
        }));
        token = cookies.accessToken || cookies.token || '';
      }
      let user = null;
      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
          user = { id: payload.sub, tokenVersion: payload.tv };
        } catch (_) { user = null; }
      }
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
      const userAgent = (req.headers['user-agent'] || '').toString();
      return { user, client: { ip, userAgent } };
    },
  }));
};