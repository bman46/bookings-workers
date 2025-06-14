import { DateTime, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const timeSlot = z.object({
	startTime: Str({ example: "09:00:00.0000000" }),
	endTime: Str({ example: "17:00:00.0000000" }),
});

export const businessHour = z.object({
	day: Str({ example: "monday" }),
	timeSlots: z.array(timeSlot),
});

export const generalAvailability = z.object({
	availabilityType: Str({ example: "bookWhenStaffAreFree" }),
	businessHours: z.array(businessHour),
});

export const schedulingPolicy = z.object({
	timeSlotInterval: Str({ example: "PT30M" }),
	minimumLeadTime: Str({ example: "P1D" }),
	maximumAdvance: Str({ example: "P365D" }),
	allowStaffSelection: z.boolean(),
	isMeetingInviteToCustomersEnabled: z.boolean(),
	generalAvailability: generalAvailability
});