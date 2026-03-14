import { z } from 'zod';

const PERIODS = ['7d', '30d', '12m'] as const;

export const statisticsQuerySchema = z.object({
  period: z.enum(PERIODS).default('7d'),
  topProductsLimit: z.coerce.number().int().min(1).max(100).default(10),
});

export const topProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const periodQuerySchema = z.object({
  period: z.enum(PERIODS).default('7d'),
});
