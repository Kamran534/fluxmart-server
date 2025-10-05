import User from '../../../models/User.js';

const toUserDTO = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const userResolvers = {
  Query: {
    me: async (_parent, _args, ctx) => {
      if (!ctx.user) return null;
      const user = await User.findById(ctx.user.id);
      return user ? toUserDTO(user) : null;
    },
  },
};

export default userResolvers;


