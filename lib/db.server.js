// Server-only Postgres access (Neon serverless driver over HTTP).
// DATABASE_URL is set automatically when a Neon database is connected to the
// Vercel project (Storage → Neon). The single `records` table is created on
// first use, so there is no migration step.
import { neon } from "@neondatabase/serverless";

let sqlClient;
let ready;

function connectionString() {
  const env = globalThis.process?.env || {};
  return env.DATABASE_URL || env.POSTGRES_URL || env.DATABASE_URL_UNPOOLED || "";
}

export function hasDatabase() {
  return Boolean(connectionString());
}

export async function getSql() {
  if (!sqlClient) {
    const url = connectionString();
    if (!url) {
      const error = new Error("DATABASE_URL is not set. Connect a Neon database to this project.");
      error.code = "NO_DATABASE";
      throw error;
    }
    sqlClient = neon(url);
  }
  ready ??= (async () => {
    await sqlClient.query(`CREATE TABLE IF NOT EXISTS records (
      entity text NOT NULL,
      id text NOT NULL,
      data jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_date timestamptz NOT NULL DEFAULT now(),
      updated_date timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (entity, id)
    )`);
    await sqlClient.query(`CREATE INDEX IF NOT EXISTS records_data_gin ON records USING gin (data jsonb_path_ops)`);
  })().catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
  return sqlClient;
}
