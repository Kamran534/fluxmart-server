import { getRedisClient } from '../redis/index.js';

const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);

const otpKey = (email) => `auth:otp:${email}`;

export const generateOTP = () => {
  let code = '';
  for (let i = 0; i < OTP_LENGTH; i++) code += Math.floor(Math.random() * 10);
  return code;
};

export const storeOTP = async (email, code) => {
  const client = getRedisClient();
  await client.set(otpKey(email), code, { EX: OTP_TTL_MINUTES * 60 });
};

export const verifyAndConsumeOTP = async (email, code) => {
  const client = getRedisClient();
  const key = otpKey(email);
  const stored = await client.get(key);
  if (!stored) return false;
  const ok = stored === code;
  if (ok) await client.del(key);
  return ok;
};

export default { generateOTP, storeOTP, verifyAndConsumeOTP };


