import * as Redis from 'ioredis';

export const redisClient = (): any => {
  const config: Redis.RedisOptions = {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: parseInt(process.env.REDIS_PORT),
    tls: {
      rejectUnauthorized: false,
    },
  };
  return config;
};
