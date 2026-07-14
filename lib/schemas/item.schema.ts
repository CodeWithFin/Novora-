import { z } from 'zod';

export const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default('pcs'),
  price: z.coerce.number().optional(),
  minStock: z.coerce.number().int().min(0).default(0),
});

export const batchItemSchema = z.object({
  items: z.array(itemSchema).min(1),
});
