import { Str, Num, Bool } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import { schedulingPolicy } from "./generic";
import { CustomQuestionReference } from "./customQuestions";

export type AppContext = Context<{ Bindings: Env }>;

export const service = z.object({
    id: Str({ example: "22351432-7995-4f38-945b-a57ca32d4a61" }),
    displayName: Str({ example: "Test Service" }),
    defaultDuration: Str({ example: "PT15M" }),
    defaultPrice: Num(),
    defaultPriceType: Str({ example: "free" }),
    description: Str({ example: "Get your test service" }),
    isHiddenFromCustomers: Bool(),
    preBuffer: Str({ example: "PT0S" }),
    postBuffer: Str({ example: "PT0S" }),
    staffMemberIds: z.array(Str({ example: "a6111cd5-3521-4fd9-bcb4-e079b20908de" })),
    schedulingPolicy: schedulingPolicy,
    customQuestions: z.array(CustomQuestionReference)
});