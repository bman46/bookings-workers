import { DateTime, Str, Bool, Num } from "chanfana";
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

// Generic DateTime object
export const DateTimeObject = z.object({
    "@odata.type": Str({ default: "#microsoft.graph.dateTimeTimeZone" }),
    dateTime: Str({ example: "2025-06-14T09:00:00" }),
    timeZone: Str({ example: "(UTC-05:00) Eastern Time (US & Canada)" }),
});

// Generic Address object
export const Address = z.object({
    street: Str().optional(),
    city: Str().optional(),
    state: Str().optional(),
    countryOrRegion: Str().optional(),
    postalCode: Str().optional(),
});

// Generic Coordinates object
export const Coordinates = z.object({
    latitude: Num().optional(),
    longitude: Num().optional(),
});

// Generic Location object
export const Location = z.object({
    address: Address.optional(),
    coordinates: Coordinates.optional(),
    displayName: Str().optional(),
    locationEmailAddress: Str().optional(),
    locationType: Str().optional(),
    locationUri: Str().optional(),
    uniqueId: Str().optional(),
    uniqueIdType: Str().optional(),
});

// Generic Contact Information
export const ContactInfo = z.object({
    emailAddress: Str({ example: "john@example.com" }),
    phone: Str().optional(),
});

// Generic Reminder object
export const Reminder = z.object({
    message: Str(),
    offset: Str(),
    recipients: Str(),
});

// Generic Custom Question Answer structure
export const BaseCustomQuestionAnswer = z.object({
    questionId: Str({ example: "3bc6fde0-4ad3-445d-ab17-0fc15dba0774" }),
    question: Str({ example: "What is your preferred appointment time?" }),
    answerInputType: Str({ example: "text" }),
    answerOptions: z.array(Str()).optional(),
    isRequired: Bool().optional(),
});