import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bookingBusinessesFetch } from "./endpoints/bookingBusinessesFetch";
import { serviceList } from "./endpoints/serviceList";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Add global CORS middleware
app.use('*', async (c, next) => {
  if (c.env.ALLOWED_ORIGINS) {
    const corsMiddleware = cors({
      origin: (origin, c) => {
        const allowedOrigins = c.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
        
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return true;
        
        // Check if the origin is in the allowed list
        return allowedOrigins.includes(origin);
      },
      allowHeaders: ['Content-Type'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      exposeHeaders: ['Content-Length'],
      maxAge: 600,
      credentials: false,
    });
    
    return corsMiddleware(c, next);
  }
  
  return next();
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/docs",
});

// Register OpenAPI endpoints
openapi.get("/api/tasks/:bookingBusinessesSlug", bookingBusinessesFetch);
openapi.get("/api/tasks/:bookingBusinessesSlug/services", serviceList);

// Export the Hono app
export default app;
