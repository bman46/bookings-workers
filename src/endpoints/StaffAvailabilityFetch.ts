import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types/service";
import { requestMicrosoftGraphJwt } from "../utils/microsoftAuth";
import { StaffAvailabilityItem, StaffAvailabilityRequest } from "../types/staffAvailability";

export class StaffAvailabilityFetch extends OpenAPIRoute {
    schema = {
        tags: ["staff"],
        summary: "Get staff availability for a bookingBusinesses by slug",
        request: {
            params: z.object({
                bookingBusinessesSlug: Str({ description: "bookingBusinesses slug", example: "test@test.com" }),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: StaffAvailabilityRequest,
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Returns staff availability, if found",
                content: {
                    "application/json": {
                        schema: z.array(StaffAvailabilityItem),
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
        const { staffIds, startDateTime, endDateTime } = data.body;

        // Fetch from MSFT graph API
        const jwt = await requestMicrosoftGraphJwt(c.env);

        const response = await fetch(
            `https://graph.microsoft.com/v1.0/solutions/bookingBusinesses/${encodeURIComponent(bookingBusinessesSlug)}/getStaffAvailability`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    staffIds,
                    startDateTime,
                    endDateTime,
                }),
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

        const availabilityResponseData = await response.json();

        const parseResult = z.array(StaffAvailabilityItem).safeParse(availabilityResponseData.value);

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

        const availabilityResponse = parseResult.data;

        return Response.json(
            {
                success: true,
                results: availabilityResponse,
            },
            {
                status: 200,
            },
        );
    }
}
