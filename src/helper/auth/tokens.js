import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { getRedisClient } from '../redis/index.js';

const ACCESS_TOKEN_TTL_SEC = Number(process.env.JWT_ACCESS_TTL_SEC || 15 * 60);
const REFRESH_TOKEN_TTL_SEC = Number(process.env.JWT_REFRESH_TTL_SEC || 7 * 24 * 60 * 60);

let cachedAccessSecret = process.env.JWT_ACCESS_SECRET;
let cachedRefreshSecret = process.env.JWT_REFRESH_SECRET;

const getAccessSecret = () => {
  if (!cachedAccessSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_ACCESS_SECRET must be set');
    }
    // Generate ephemeral dev secret if not provided
    cachedAccessSecret = randomBytes(32).toString('base64url');
    try { console.log(' Using ephemeral JWT_ACCESS_SECRET (dev) '.bgYellow.black); } catch (_) {}
  }
  return cachedAccessSecret;
};

const getRefreshSecret = () => {
  if (!cachedRefreshSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_REFRESH_SECRET must be set');
    }
    cachedRefreshSecret = randomBytes(32).toString('base64url');
    try { console.log(' Using ephemeral JWT_REFRESH_SECRET (dev) '.bgYellow.black); } catch (_) {}
  }
  return cachedRefreshSecret;
};

export const signAccessToken = (user) => {
  const payload = { sub: user.id, tv: user.tokenVersion || 0 };
  return jwt.sign(payload, getAccessSecret(), { expiresIn: ACCESS_TOKEN_TTL_SEC });
};

export const signRefreshToken = (user, jti) => {
  const payload = { sub: user.id, jti, tv: user.tokenVersion || 0 };
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: REFRESH_TOKEN_TTL_SEC });
};

export const verifyAccessToken = (token) => jwt.verify(token, getAccessSecret());
export const verifyRefreshToken = (token) => jwt.verify(token, getRefreshSecret());

const refreshKey = (userId, jti) => `auth:rt:${userId}:${jti}`;

export const storeRefreshToken = async (userId, jti, token) => {
  const client = getRedisClient();
  await client.set(refreshKey(userId, jti), token, { EX: REFRESH_TOKEN_TTL_SEC });
};

export const rotateRefreshToken = async (userId, oldJti, newJti, newToken) => {
  const client = getRedisClient();
  if (oldJti) await client.del(refreshKey(userId, oldJti));
  await client.set(refreshKey(userId, newJti), newToken, { EX: REFRESH_TOKEN_TTL_SEC });
};

export const isRefreshTokenValid = async (userId, jti, token) => {
  const client = getRedisClient();
  const stored = await client.get(refreshKey(userId, jti));
  return stored === token;
};

export const revokeAllRefreshTokensForUser = async (userId) => {
  const client = getRedisClient();
  const pattern = `auth:rt:${userId}:*`;
  let cursor = 0;
  do {
    const res = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = Number(res.cursor ?? res[0] ?? 0);
    const keys = res.keys ?? res[1] ?? [];
    if (keys.length) await client.del(keys);
  } while (cursor !== 0);
};

export const generateJti = () => {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  rotateRefreshToken,
  isRefreshTokenValid,
  revokeAllRefreshTokensForUser,
  generateJti,
};


