import { authResolvers } from './user/authResolvers.js';
import { userResolvers } from './user/userResolvers.js';

export const resolvers = {
  Query: {
    ...userResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
  },
};