import { z } from 'zod';

export const PaginationSchema = z
  .object({
    limit: z.number().optional(),
    offset: z.number().optional(),
    total: z.number().optional(),
  })
  .passthrough();

export const EventCategorySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
    parentId: z.string().optional(),
  })
  .passthrough();

export const EventMarketOutcomeSchema = z
  .object({
    id: z.string(),
    label: z.string().optional(),
    odds: z.number().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export const EventMarketSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    group: z.string().optional(),
    status: z.string().optional(),
    outcomes: z.array(EventMarketOutcomeSchema).optional(),
  })
  .passthrough();

export const EventSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    league: z.string().optional(),
    categoryId: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    country: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const EventArraySchema = z.array(EventSchema);

export const EventWithMarketsSchema = EventSchema.extend({
  markets: z.array(EventMarketSchema).optional(),
});

export const EventListResponseSchema = z
  .object({
    events: z.array(EventSchema).optional(),
    pagination: PaginationSchema.optional(),
  })
  .passthrough();

export const EventCollectionSchema = z.union([EventArraySchema, EventListResponseSchema]);

export const EventMarketsListSchema = z.array(EventMarketSchema);

export const EventCategoriesSchema = z.array(EventCategorySchema);

export type EventSnapshot = z.infer<typeof EventSchema>;
export type EventWithMarketsSnapshot = z.infer<typeof EventWithMarketsSchema>;
export type EventMarketSnapshot = z.infer<typeof EventMarketSchema>;
export type EventCategorySnapshot = z.infer<typeof EventCategorySchema>;
export type EventCollectionSnapshot = z.infer<typeof EventCollectionSchema>;
