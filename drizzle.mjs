import { config } from "dotenv";
config({ path: ".env.local" });

export default {
  dialect: "turso",
  schema: "./lib/schema.js",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};
