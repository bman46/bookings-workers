import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, bookingBusinesses } from "../types/bookingBusinesses";
import { requestMicrosoftGraphJwt } from "../utils/microsoftAuth";

export class bookingBusinessesFetch extends OpenAPIRoute {
	schema = {
		tags: ["bookingBusinesses"],
		summary: "Get a bookingBusinesses by slug",
		request: {
			params: z.object({
				bookingBusinessesSlug: Str({ description: "bookingBusinesses slug", example: "test@test.com" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns a single bookingBusinesses if found",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							result: z.object({
								task: bookingBusinesses,
							}),
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

		// Fetch from MSFT graph API
		const jwt = await requestMicrosoftGraphJwt(c.env);

		// Construct a $select query from the Zod schema to fetch only the fields we need.
		// This reduces payload size and parsing time.
		const fields = Object.keys(bookingBusinesses.shape);
		const selectQuery = `$select=${fields.join(",")}`;

		const response = await fetch(
			`https://graph.microsoft.com/v1.0/solutions/bookingBusinesses/${encodeURIComponent(
				bookingBusinessesSlug,
			)}?${selectQuery}`,
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

		const business = await response.json();

		// Fit the response into the bookingBusinesses object
		const parsedBusiness = bookingBusinesses.safeParse(business);

		if (!parsedBusiness.success) {
			return Response.json(
				{
					success: false,
					error: "Invalid business object structure",
				},
				{
					status: 500,
				},
			);
		}

		return {
			success: true,
			result: {
				task: parsedBusiness.data,
			},
		};
	}
}
