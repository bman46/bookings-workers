import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bookingBusinessesFetch } from "./endpoints/bookingBusinessesFetch";
import { ServiceList } from "./endpoints/serviceListFetch";
import { StaffAvailabilityFetch } from "./endpoints/StaffAvailabilityFetch";
import { CustomQuestionsFetch } from "./endpoints/customQuestionsFetch";
import { AppointmentCreate } from "./endpoints/appointmentCreate";
import { env } from "cloudflare:workers";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes, using env.ALLOWED_ORIGINS
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!env.ALLOWED_ORIGINS) {
        console.log("env.ALLOWED_ORIGINS is null, skipping CORS check.");
        return "";
      }
      const allowed = env.ALLOWED_ORIGINS.split(",").map(o => o.trim());
      if (allowed.includes("*")) return "*";
      if (!origin) return "";
      return allowed.includes(origin) ? origin : "";
    }
  })
);

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: env.DOCS_URL || null,
  redoc_url: env.REDOCS_URL || null,
  openapi_url: env.OPENAPI_URL || null
});

// Register OpenAPI endpoints
openapi.get("/api/tasks/:bookingBusinessesSlug", bookingBusinessesFetch);
openapi.get("/api/tasks/:bookingBusinessesSlug/services", ServiceList);
openapi.post(
  "/solutions/bookingBusinesses/:bookingBusinessesSlug/staffAvailability",
  StaffAvailabilityFetch
);
openapi.get(
  "/solutions/bookingBusinesses/:bookingBusinessesSlug/customQuestions",
  CustomQuestionsFetch
);
openapi.post(
  "/solutions/bookingBusinesses/:bookingBusinessesSlug/appointments",
  AppointmentCreate
);

// Export the Hono app
export default app;
