import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        "Set DATABASE_URL in your environment so Drizzle Kit can connect."
    );
}

export default defineConfig({
    schema: "./src/db/schema.js",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: connectionString,
    }
});
