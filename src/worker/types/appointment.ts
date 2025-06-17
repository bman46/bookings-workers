import { Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import { DateTimeObject } from "./generic";

export type AppContext = Context<{ Bindings: Env }>;

export const bookingQuestionAnswer = z.object({
    "@odata.type": Str({ default: "#microsoft.graph.bookingQuestionAnswer" }),
    answer: Str({ example: "I really like ice cream" }).optional(),
    questionId: Str({ example: "uuid-12313" }),
    selectedOptions: z.array(Str({ example: "option1" })),
    answerInputType: Str({ example: "text" }),
});

export const CustomerObject = z.object({
    "@odata.type": Str({ default: "#microsoft.graph.bookingCustomerInformation" }),
    name: Str({ example: "John Doe" }),
    emailAddress: Str({ example: "test@test.com" }),
    phone: Str({ example: "8888888888" }),
    customQuestionAnswers: z.array(bookingQuestionAnswer).optional(),
    notes: Str({ example: "No mayo on the sandwiches" }).optional(),
    timeZone: Str({ example: "Pacific Standard Time" }),
});

export const AppointmentObject = z.object({
    serviceId: Str({ example: "uuid-213-23" }),
    staffMemberIds: z.array(Str({ example: "uuid-12023-123" })),
    endDateTime: DateTimeObject,
    startDateTime: DateTimeObject,
    isCustomerAllowedToManageBooking: z.boolean().optional(),
    optOutOfCustomerEmail: z.boolean().optional(),
    smsNotificationsEnabled: z.boolean().optional(),
    customers: z.array(CustomerObject),
    isSelfServiceEnabled: z.boolean().optional(),
    customerNotes: Str({ example: "No mayo on the sandwiches" }).optional(),
    serviceNotes: Str({ example: "No mayo on the sandwiches" }).optional(),
    serviceLocation: z.any().optional(),
});