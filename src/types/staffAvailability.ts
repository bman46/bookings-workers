import { Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const DateTimeObject = z.object({
    dateTime: Str({ example: "2025-06-14T09:00:00" }),
    timeZone: Str({ example: "(UTC-05:00) Eastern Time (US & Canada)" }),
});

export const AvailabilityItem = z.object({
    status: Str({ example: "available" }), // "available", "busy", "outOfOffice", etc.
    startDateTime: DateTimeObject,
    endDateTime: DateTimeObject,
    serviceId: Str({ example: "22351432-7995-4f38-945b-a57ca32d4a61" }),
});

export const StaffAvailabilityItem = z.object({
    staffId: Str({ example: "b6111cd4-3528-4fd9-bcb9-e079b20908df" }),
    availabilityItems: z.array(AvailabilityItem),
});

// Define the request schema
export const StaffAvailabilityRequest = z.object({
    // Array of staff IDs to check availability for
    staffIds: z.array(Str({ example: "a6111cd5-3521-4fd9-bcb4-e079b20908de" })),
    // ISO 8601 time range
    startDateTime: DateTimeObject,
    endDateTime: DateTimeObject,
});