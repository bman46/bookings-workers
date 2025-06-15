import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, service } from "../types/service";
import { requestMicrosoftGraphJwt } from "../utils/microsoftAuth";

export class ServiceList extends OpenAPIRoute {
	schema = {
		tags: ["services"],
		summary: "Get services for a bookingBusinesses by slug",
		request: {
			params: z.object({
				bookingBusinessesSlug: Str({ description: "bookingBusinesses slug", example: "test@test.com" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns a list of services, if found",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							results: z.array(service),
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

		// Retrieve the validated slug
		const { bookingBusinessesSlug } = data.params;

		console.log("bookingBusinessesSlug:", bookingBusinessesSlug);

		// Fetch from MSFT graph API
		const jwt = await requestMicrosoftGraphJwt(c.env);

		const response = await fetch(
			`https://graph.microsoft.com/v1.0/solutions/bookingBusinesses/${encodeURIComponent(bookingBusinessesSlug)}/services`,
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

		const servicesResponse = await response.json();

		const servicesArray = Array.isArray(servicesResponse.value) ? servicesResponse.value : [];

		const parsedServices = z.array(service).safeParse(servicesArray);

		if (!parsedServices.success) {
			return Response.json(
				{
					success: false,
					error: "Invalid service object structure",
				},
				{
					status: 500,
				},
			);
		}

		return {
			services: {
				success: true,
				results: parsedServices.data,
			},
		};
	}
}
