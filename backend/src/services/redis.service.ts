import { createClient } from 'redis';

console.log('REDIS_URL:', process.env['REDIS_URL']);

export const redisClient = createClient({
  url: process.env['REDIS_URL'] || 'redis://default:fiVF8RxUC1e4r1h9gUHCjTBs48nShkeP@redis-17547.c321.us-east-1-2.ec2.redns.redis-cloud.com:17547'
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
