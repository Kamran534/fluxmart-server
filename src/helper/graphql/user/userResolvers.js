import User from '../../../models/User.js';
import { createPresignedUploadUrl, createPresignedGetUrl } from '../../s3/index.js';

const sanitizeAddressInput = (input) => {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  const fields = ['label', 'line1', 'line2', 'city', 'state', 'postalCode', 'country', 'isDefault'];
  for (const key of fields) {
    if (key in input) {
      const val = input[key];
      out[key] = typeof val === 'string' ? val.trim() : val;
    }
  }
  return out;
};

const toUserDTO = async (user) => {
  let profileImageUrl = user.profileImageUrl;
  
  // If profileImageUrl is an S3 key, generate a presigned URL
  if (profileImageUrl && profileImageUrl.startsWith('users/')) {
    try {
      const expiresInSec = Number(process.env.S3_GET_URL_TTL_SEC || 300);
      profileImageUrl = await createPresignedGetUrl({ key: profileImageUrl, expiresInSec });
    } catch (err) {
      console.log(`Failed to generate presigned URL for user ${user.id}: ${err.message}`);
      profileImageUrl = null;
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profileImageUrl,
    isEmailVerified: user.isEmailVerified,
    roles: Array.isArray(user.roles) ? user.roles : [],
    addresses: Array.isArray(user.addresses) ? user.addresses : [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const userResolvers = {
  Query: {
    me: async (_parent, _args, ctx) => {
      if (!ctx.user) return null;
      const user = await User.findById(ctx.user.id);
      return user ? await toUserDTO(user) : null;
    },
  },
    setRoles: async (_parent, { userId, roles }, ctx) => {
      if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      const acting = await User.findById(ctx.user.id);
      if (!acting || !Array.isArray(acting.roles) || !acting.roles.includes('admin')) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
      }
      if (!Array.isArray(roles) || roles.length === 0 || roles.some(r => typeof r !== 'string' || !r.trim())) {
        throw Object.assign(new Error('Invalid roles'), { status: 400 });
      }
      const target = await User.findById(userId);
      if (!target) throw Object.assign(new Error('User not found'), { status: 404 });
      target.roles = roles.map(r => r.trim());
      await target.save();
      return await toUserDTO(target);
    },
  Mutation: {
    presignProfileImageUpload: async (_parent, { input }, ctx) => {
      if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      const contentType = (input?.contentType || '').toLowerCase();
      if (!/^image\/(jpeg|jpg|png|webp|gif)$/.test(contentType)) {
        throw Object.assign(new Error('Invalid image content type'), { status: 400 });
      }
      const ext = (input?.fileExtension || '').replace(/^\./, '') || contentType.split('/')[1];
      const key = `users/${ctx.user.id}/profile/${Date.now()}.${ext}`;
      const presigned = await createPresignedUploadUrl({ key, contentType });
      return presigned;
    },
    setProfileImage: async (_parent, { key }, ctx) => {
      if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      if (!key || !key.startsWith(`users/${ctx.user.id}/profile/`)) {
        throw Object.assign(new Error('Invalid object key'), { status: 400 });
      }
      const user = await User.findById(ctx.user.id);
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
      user.profileImageUrl = key; // Store S3 key instead of public URL
      await user.save();
      return await toUserDTO(user);
    },
    presignProfileImageView: async (_parent, { key }, ctx) => {
      if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      if (!key || !key.startsWith(`users/${ctx.user.id}/profile/`)) {
        throw Object.assign(new Error('Invalid object key'), { status: 400 });
      }
      const expiresInSec = Number(process.env.S3_GET_URL_TTL_SEC || 300);
      const url = await createPresignedGetUrl({ key, expiresInSec });
      return { url, expiresIn: expiresInSec };
    },
    addAddress: async (_parent, { input }, ctx) => {
      if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      const user = await User.findById(ctx.user.id);
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
      const addr = sanitizeAddressInput(input);
      if (addr.isDefault) {
        user.addresses = (user.addresses || []).map(a => ({ ...a.toObject?.() || a, isDefault: false }));
      }
      user.addresses = [...(user.addresses || []), addr];
      await user.save();
      return await toUserDTO(user);
    },
    updateAddress: async (_parent, { index, input }, ctx) => {
      if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      const user = await User.findById(ctx.user.id);
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
      const addresses = user.addresses || [];
      if (typeof index !== 'number' || index < 0 || index >= addresses.length) {
        throw Object.assign(new Error('Invalid address index'), { status: 400 });
      }
      const updates = sanitizeAddressInput(input);
      if (updates.isDefault) {
        user.addresses = addresses.map((a, i) => ({ ...a.toObject?.() || a, isDefault: i === index }));
      }
      user.addresses[index] = { ...(addresses[index].toObject?.() || addresses[index]), ...updates };
      await user.save();
      return await toUserDTO(user);
    },
    removeAddress: async (_parent, { index }, ctx) => {
      if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      const user = await User.findById(ctx.user.id);
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
      const addresses = user.addresses || [];
      if (typeof index !== 'number' || index < 0 || index >= addresses.length) {
        throw Object.assign(new Error('Invalid address index'), { status: 400 });
      }
      const removed = addresses.splice(index, 1)[0];
      // If removed one was default and there are addresses left, set first as default
      if (removed?.isDefault && addresses.length > 0) {
        addresses[0] = { ...(addresses[0].toObject?.() || addresses[0]), isDefault: true };
      }
      user.addresses = addresses;
      await user.save();
      return await toUserDTO(user);
    },
    setDefaultAddress: async (_parent, { index }, ctx) => {
      if (!ctx.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      const user = await User.findById(ctx.user.id);
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
      const addresses = user.addresses || [];
      if (typeof index !== 'number' || index < 0 || index >= addresses.length) {
        throw Object.assign(new Error('Invalid address index'), { status: 400 });
      }
      user.addresses = addresses.map((a, i) => ({ ...a.toObject?.() || a, isDefault: i === index }));
      await user.save();
      return await toUserDTO(user);
    },
  },
};

export default userResolvers;


