import { Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const CustomQuestion = z.object({
    id: Str({ example: "3bc6fde0-4ad3-445d-ab17-0fc15dba0774" }),
    displayName: Str({ example: "What is your preferred contact method?" }),
    answerInputType: Str({ example: "text" }), // "text", "radioButton", "unknownFutureValue"
    answerOptions: z.array(Str()).optional(), // Only for radioButton type
});