import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types/service";
import { requestMicrosoftGraphJwt } from "../utils/microsoftAuth";
import { AppointmentObject } from "../types/appointment";

export class AppointmentCreate extends OpenAPIRoute {
    schema = {
        tags: ["appointments"],
        summary: "Create a new appointment for a bookingBusinesses by slug",
        request: {
            params: z.object({
                bookingBusinessesSlug: Str({ description: "bookingBusinesses slug", example: "test@test.com" }),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: AppointmentObject,
                    },
                },
            },
        },
        responses: {
            "201": {
                description: "Appointment created successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            results: AppointmentObject,
                        }),
                    },
                },
            },
            "400": {
                description: "Bad request - invalid appointment data",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            error: Str(),
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
        const appointmentData = data.body;

        console.log("Creating appointment for bookingBusinessesSlug:", bookingBusinessesSlug);
        console.log("data: ", appointmentData);

        // Fetch from MSFT graph API
        const jwt = await requestMicrosoftGraphJwt(c.env);

        const response = await fetch(
            `https://graph.microsoft.com/v1.0/solutions/bookingBusinesses/${encodeURIComponent(bookingBusinessesSlug)}/appointments`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(appointmentData),
            },
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Graph API error:", errorBody);
            
            const status = response.status;
            const errorMessage = status === 404 ? "BookingBusiness not found" : "Failed to create appointment";
            
            return Response.json(
                {
                    success: false,
                    error: errorMessage,
                    details: errorBody,
                },
                {
                    status: status,
                },
            );
        }

        const appointmentResponseData = await response.json();

        const parseResult = AppointmentObject.safeParse(appointmentResponseData);

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

        const appointmentResponse = parseResult.data;

        return Response.json(
            {
                success: true,
                results: appointmentResponse,
            },
            {
                status: 201,
            },
        );
    }
}