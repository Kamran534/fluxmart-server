import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectRedis = async () => {
	if (isConnected && redisClient) return redisClient;

	const url = process.env.REDIS_URL || 'redis://localhost:6379';
	const maxRetries = Number(process.env.REDIS_MAX_RETRIES || 5);
	const baseDelayMs = Number(process.env.REDIS_RETRY_DELAY_MS || 500);

	redisClient = createClient({ url });

	if (redisClient.listeners('error').length === 0) {
		redisClient.on('error', (err) => {
			console.log(` Redis error: ${err.message} `.bgRed.white.bold);
		});
	}

	if (redisClient.listeners('ready').length === 0) {
		redisClient.on('ready', () => {
			console.log(' Redis connected '.bgGreen.black.bold);
		});
	}

	if (redisClient.listeners('end').length === 0) {
		redisClient.on('end', () => {
			console.log(' Redis disconnected '.bgYellow.black.bold);
		});
	}

	let attempt = 0;
	while (true) {
		try {
			await redisClient.connect();
			// readiness check
			await redisClient.ping();
			isConnected = true;
			return redisClient;
		} catch (err) {
			attempt += 1;
			if (attempt > maxRetries) {
				console.log(` Redis connect failed after ${maxRetries} retries `.bgRed.white.bold);
				throw err;
			}
			const delay = baseDelayMs * Math.pow(2, attempt - 1);
			console.log(` Redis connect retry ${attempt}/${maxRetries} in ${delay}ms `.yellow);
			await sleep(delay);
		}
	}
};

export const disconnectRedis = async () => {
	if (!redisClient) return;
	try {
		await redisClient.quit();
	} finally {
		isConnected = false;
		redisClient = null;
	}
};

export const getRedisClient = () => redisClient;

export default {
	connectRedis,
	disconnectRedis,
	getRedisClient,
};
