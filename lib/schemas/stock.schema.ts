import { z } from 'zod';

export const stockLineSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const stockInSchema = z.object({
  items: z.array(stockLineSchema).min(1),
  transactionDate: z.string().optional(),
  globalNotes: z.string().optional(),
});

export const stockOutLineSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const stockOutSchema = z.object({
  items: z.array(stockOutLineSchema).min(1),
  shopId: z.string().uuid(),
  transactionDate: z.string().optional(),
  globalNotes: z.string().optional(),
});
