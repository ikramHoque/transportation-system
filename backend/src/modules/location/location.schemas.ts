import { z } from "zod";

export const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isWaiting: z.boolean().optional(),
});

export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
