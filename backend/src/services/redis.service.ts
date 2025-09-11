import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env['REDIS_URL'] || ''
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export async function initRedis() {
  try {
    await redisClient.connect();
    console.log('Redis connected');
  } catch (err) {
    console.error('Redis connection failed:', err);
  }
}
