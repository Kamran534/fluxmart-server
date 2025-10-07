import { randomBytes } from 'crypto';
import { getRedisClient } from '../redis/index.js';

const RESET_TTL_HOURS = Number(process.env.RESET_TTL_HOURS || 1);

const resetKey = (token) => `auth:pr:${token}`; // password reset token -> email

export const generateResetToken = () => randomBytes(32).toString('base64url');

export const storeResetToken = async (email, token) => {
  const client = getRedisClient();
  if (!client) throw new Error('Redis not connected');
  await client.set(resetKey(token), email, { EX: RESET_TTL_HOURS * 60 * 60 });
};

export const consumeResetToken = async (token) => {
  const client = getRedisClient();
  if (!client) throw new Error('Redis not connected');
  const key = resetKey(token);
  const email = await client.get(key);
  if (!email) return null;
  await client.del(key);
  return email;
};

export default { generateResetToken, storeResetToken, consumeResetToken };


