import { Str, Bool } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import { businessHour, schedulingPolicy } from "./generic";

export type AppContext = Context<{ Bindings: Env }>;

export const bookingPageSettings = z.object({
	privacyPolicyWebUrl: Str({ example: "https://google.com/privacy" }),
	termsAndConditionsWebUrl: Str({ example: "https://google.com/terms" }),
	businessTimeZone: Str({ example: "Eastern Standard Time" }),
	isTimeSlotTimeZoneSetToBusinessTimeZone: Bool(),
});

export const bookingBusinesses = z.object({
	id: Str({ example: "test@test.com" }),
	displayName: Str({ example: "Test Booking Page" }),
	businessHours: z.array(businessHour),
	schedulingPolicy: schedulingPolicy,
	bookingPageSettings: bookingPageSettings
});