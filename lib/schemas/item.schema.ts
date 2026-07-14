import { z } from 'zod';

export const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default('pcs'),
  minStock: z.coerce.number().int().min(0).default(10),
});

export const batchRowSchema = itemSchema.extend({
  quantity: z.coerce.number().int().positive().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

export const batchItemSchema = z.object({
  items: z.array(batchRowSchema).min(1),
});
