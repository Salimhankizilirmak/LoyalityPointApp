import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL || "";
const finalUrl = url.startsWith("libsql://") 
  ? url.replace("libsql://", "https://") 
  : url;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: finalUrl,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
