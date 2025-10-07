import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../../../models/User.js';
import emailService from '../../../helper/mail/emailService.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  rotateRefreshToken,
  isRefreshTokenValid,
  revokeAllRefreshTokensForUser,
  generateJti,
} from '../../auth/tokens.js';
import { generateOTP, storeOTP, verifyAndConsumeOTP } from '../../auth/otp.js';
import { generateResetToken, storeResetToken, consumeResetToken } from '../../auth/reset.js';

const toUserDTO = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  roles: Array.isArray(user.roles) ? user.roles : [],
  addresses: Array.isArray(user.addresses) ? user.addresses : [],
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const authResolvers = {
  Mutation: {
    register: async (_parent, { input }, ctx) => {
      const email = input.email.trim().toLowerCase();
      const existing = await User.findOne({ email });
      if (existing) throw Object.assign(new Error('Email already in use'), { status: 400 });

      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await User.create({
        email,
        passwordHash,
        name: input.name || undefined,
        roles: ['customer'],
        addresses: [],
      });

      try {
        const otp = generateOTP();
        await storeOTP(email, otp);
        await emailService.sendOTPEmail({
          to: email,
          name: user.name || user.email,
          otp,
          expiryMinutes: Number(process.env.OTP_TTL_MINUTES || 10),
        });
      } catch (err) {
        try { console.log(` OTP email send failed on register for ${email}: ${err.message} `.bgRed.white.bold); } catch (_) { console.log(`OTP email send failed on register for ${email}: ${err.message}`); }
      }

      const accessToken = signAccessToken(user);
      const jti = generateJti();
      const refreshToken = signRefreshToken(user, jti);
      await storeRefreshToken(user.id, jti, refreshToken);
      try {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const ttlSec = Number(process.env.JWT_REFRESH_TTL_SEC || 7 * 24 * 60 * 60);
        const expiresAt = new Date(Date.now() + ttlSec * 1000);
        user.sessions = (user.sessions || []).filter(s => s.jti !== jti);
        user.sessions.push({ jti, tokenHash, userAgent: ctx?.client?.userAgent, ip: ctx?.client?.ip, expiresAt });
        await user.save();
      } catch (_) {}

      return { user: toUserDTO(user), tokens: { accessToken, refreshToken } };
    },

    login: async (_parent, { input }, ctx) => {
      const email = input.email.trim().toLowerCase();
      const user = await User.findOne({ email });
      if (!user) {
        try { console.log(` Login failed: user not found for ${email} `.bgYellow.black); } catch (_) { console.log(`Login failed: user not found for ${email}`); }
        throw Object.assign(new Error('Invalid credentials'), { status: 401 });
      }
      const ok = await bcrypt.compare(input.password, user.passwordHash);
      if (!ok) {
        try { console.log(` Login failed: bad password for ${email} `.bgYellow.black); } catch (_) { console.log(`Login failed: bad password for ${email}`); }
        throw Object.assign(new Error('Invalid credentials'), { status: 401 });
      }
      if (!user.isEmailVerified) {
        try { console.log(` Login blocked: email not verified for ${email} `.bgYellow.black); } catch (_) { console.log(`Login blocked: email not verified for ${email}`); }
        throw Object.assign(new Error('Email not verified'), { status: 403 });
      }

      const accessToken = signAccessToken(user);
      const jti = generateJti();
      const refreshToken = signRefreshToken(user, jti);
      await storeRefreshToken(user.id, jti, refreshToken);
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const ttlSec = Number(process.env.JWT_REFRESH_TTL_SEC || 7 * 24 * 60 * 60);
      const expiresAt = new Date(Date.now() + ttlSec * 1000);
      user.sessions = (user.sessions || []).filter(s => s.jti !== jti);
      user.sessions.push({ jti, tokenHash, userAgent: ctx?.client?.userAgent, ip: ctx?.client?.ip, expiresAt });
      await user.save();

      return { user: toUserDTO(user), tokens: { accessToken, refreshToken } };
    },

    refreshToken: async (_parent, { refreshToken }, ctx) => {
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (e) {
        throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
      }

      const { sub: userId, jti, tv } = payload;
      const user = await User.findById(userId);
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
      if ((user.tokenVersion || 0) !== (tv || 0)) {
        throw Object.assign(new Error('Token revoked'), { status: 401 });
      }

      const valid = await isRefreshTokenValid(userId, jti, refreshToken);
      if (!valid) {
        // Reuse detected or token rotated: revoke all sessions and bump tokenVersion
        try {
          await revokeAllRefreshTokensForUser(userId);
          user.tokenVersion = (user.tokenVersion || 0) + 1;
          user.sessions = [];
          await user.save();
          try { console.log(` Refresh token reuse detected for user ${user.email} — revoked all sessions `.bgRed.white.bold); } catch (_) { console.log(`Refresh token reuse detected for user ${user.email} — revoked all sessions`); }
        } catch (_) {}
        throw Object.assign(new Error('Refresh token expired or rotated'), { status: 401 });
      }

      const newAccessToken = signAccessToken(user);
      const newJti = generateJti();
      const newRefreshToken = signRefreshToken(user, newJti);
      await rotateRefreshToken(userId, jti, newJti, newRefreshToken);
      const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      const ttlSec = Number(process.env.JWT_REFRESH_TTL_SEC || 7 * 24 * 60 * 60);
      const expiresAt = new Date(Date.now() + ttlSec * 1000);
      user.sessions = (user.sessions || []).filter(s => s.jti !== jti);
      user.sessions.push({ jti: newJti, tokenHash: newHash, userAgent: ctx?.client?.userAgent, ip: ctx?.client?.ip, expiresAt });
      await user.save();

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    },

    logout: async (_parent, _args, ctx) => {
      if (!ctx.user) return true;
      await revokeAllRefreshTokensForUser(ctx.user.id);
      await User.findByIdAndUpdate(ctx.user.id, { $set: { sessions: [] } });
      return true;
    },

    requestEmailOTP: async (_parent, { email }) => {
      const normalized = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalized });
      if (!user) return true;
      const otp = generateOTP();
      await storeOTP(normalized, otp);
      try {
        await emailService.sendOTPEmail({ to: normalized, name: user.name || user.email, otp, expiryMinutes: Number(process.env.OTP_TTL_MINUTES || 10) });
      } catch (err) {
        try { console.log(` OTP email send failed for ${normalized}: ${err.message} `.bgRed.white.bold); } catch (_) { console.log(`OTP email send failed for ${normalized}: ${err.message}`); }
      }
      return true;
    },

    verifyEmailOTP: async (_parent, { email, otp }, ctx) => {
      const normalized = email.trim().toLowerCase();
      const ok = await verifyAndConsumeOTP(normalized, otp);
      if (!ok) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
      const user = await User.findOne({ email: normalized });
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
        try { await emailService.sendWelcomeEmail({ to: normalized, name: user.name || user.email }); } catch (err) { try { console.log(` Welcome email send failed for ${normalized}: ${err.message} `.bgRed.white.bold); } catch (_) { console.log(`Welcome email send failed for ${normalized}: ${err.message}`); } }
      }
      const accessToken = signAccessToken(user);
      const jti = generateJti();
      const refreshToken = signRefreshToken(user, jti);
      await storeRefreshToken(user.id, jti, refreshToken);
      try {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const ttlSec = Number(process.env.JWT_REFRESH_TTL_SEC || 7 * 24 * 60 * 60);
        const expiresAt = new Date(Date.now() + ttlSec * 1000);
        user.sessions = (user.sessions || []).filter(s => s.jti !== jti);
        user.sessions.push({ jti, tokenHash, userAgent: ctx?.client?.userAgent, ip: ctx?.client?.ip, expiresAt });
        await user.save();
      } catch (_) {}
      return { user: toUserDTO(user), tokens: { accessToken, refreshToken } };
    },

    requestPasswordReset: async (_parent, { email }) => {
      const normalized = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalized });
      if (!user) return true; // do not reveal existence
      try {
        const token = generateResetToken();
        await storeResetToken(normalized, token);
        const frontendBase = process.env.FRONTEND_BASE_URL || 'https://fluxmart.com';
        const resetLink = `${frontendBase}/reset-password?token=${encodeURIComponent(token)}`;
        await emailService.sendPasswordResetEmail({ to: normalized, name: user.name || user.email, resetLink, expiryHours: Number(process.env.RESET_TTL_HOURS || 1) });
      } catch (err) {
        try { console.log(` Password reset email failed for ${normalized}: ${err.message} `.bgRed.white.bold); } catch (_) { console.log(`Password reset email failed for ${normalized}: ${err.message}`); }
      }
      return true;
    },

    resetPassword: async (_parent, { token, newPassword }) => {
      if (!newPassword || newPassword.length < 8) {
        throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 });
      }
      const email = await consumeResetToken(token);
      if (!email) {
        throw Object.assign(new Error('Invalid or expired token'), { status: 400 });
      }
      const user = await User.findOne({ email });
      if (!user) return true;
      user.passwordHash = await bcrypt.hash(newPassword, 10);
      // Bump token version to revoke all refresh tokens
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      user.sessions = [];
      await user.save();
      try { await revokeAllRefreshTokensForUser(user.id); } catch (_) {}
      return true;
    },
  },
};

export default authResolvers;


