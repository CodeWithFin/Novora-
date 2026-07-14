import { z } from 'zod';

export const shopSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
});
