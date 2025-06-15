import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types/service";
import { requestMicrosoftGraphJwt } from "../utils/microsoftAuth";
import { CustomQuestion } from "../types/customQuestions";

export class CustomQuestionsFetch extends OpenAPIRoute {
    schema = {
        tags: ["customQuestions"],
        summary: "Get custom questions for a bookingBusinesses by slug",
        request: {
            params: z.object({
                bookingBusinessesSlug: Str({ description: "bookingBusinesses slug", example: "test@test.com" }),
            }),
        },
        responses: {
            "200": {
                description: "Returns custom questions, if found",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            results: z.array(CustomQuestion),
                        }),
                    },
                },
            },
            "404": {
                description: "bookingBusinesses not found",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            error: Str(),
                        }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        // Get validated data
        const data = await this.getValidatedData<typeof this.schema>();
        const { bookingBusinessesSlug } = data.params;

        console.log("bookingBusinessesSlug:", bookingBusinessesSlug);

        // Fetch from MSFT graph API
        const jwt = await requestMicrosoftGraphJwt(c.env);

        const response = await fetch(
            `https://graph.microsoft.com/v1.0/solutions/bookingBusinesses/${encodeURIComponent(bookingBusinessesSlug)}/customQuestions`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
            },
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Graph API error:", errorBody);
            return Response.json(
                {
                    success: false,
                    error: "Object not found",
                    details: errorBody,
                },
                {
                    status: 404,
                },
            );
        }

        const customQuestionsResponseData = await response.json();

        const parseResult = z.array(CustomQuestion).safeParse(customQuestionsResponseData.value);

        if (!parseResult.success) {
            console.error("Invalid response format:", parseResult.error);
            console.error("Expected schema vs actual data mismatch");
            return Response.json(
                {
                    success: false,
                    error: "Invalid response format from Microsoft Graph API",
                    details: parseResult.error.issues,
                },
                { status: 500 }
            );
        }

        const customQuestionsResponse = parseResult.data;

        return Response.json(
            {
                success: true,
                results: customQuestionsResponse,
            },
            {
                status: 200,
            },
        );
    }
}