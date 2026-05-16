import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const url = process.env.TURSO_DATABASE_URL?.trim() || "";
const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || "";

// Turso için libsql:// bazen HTTP transport'ta sorun çıkarabilir, https:// daha garantidir
const finalUrl = url.startsWith("libsql://") 
  ? url.replace("libsql://", "https://") 
  : url;

const client = createClient({
  url: finalUrl,
  authToken: authToken,
});

export const db = drizzle(client, { schema });
