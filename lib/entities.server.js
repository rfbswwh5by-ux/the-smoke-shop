// Server-only drop-in replacement for the Base44 SDK's entity API, backed by
// one Postgres table (see db.server.js). It supports exactly what this app uses:
// list, filter, get, create, update, delete, deleteMany, updateMany,
// bulkUpdate, and count. Results come back as { items } like the SDK's pages.
import { getSql } from "@/lib/db.server";
import { sendEmail, uploadPublicFile } from "@/lib/integrations.server";

const SYSTEM_SORT = new Set(["created_date", "updated_date", "id"]);

function newId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toRecord(row) {
  if (!row) return null;
  const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
  const iso = (value) => (value instanceof Date ? value.toISOString() : value ? new Date(value).toISOString() : null);
  return { ...data, id: row.id, created_date: iso(row.created_date), updated_date: iso(row.updated_date) };
}

function stripSystem(values) {
  const { id, created_date, updated_date, ...rest } = values || {};
  return rest;
}

// Builds a WHERE clause for Base44-style queries: equality on fields, plus
// { field: { $in: [...] } }. `id` is matched against the id column.
function where(entity, query, params) {
  params.push(entity);
  const parts = [`entity = $${params.length}`];
  const equals = {};
  for (const [key, value] of Object.entries(query || {})) {
    if (value && typeof value === "object" && !Array.isArray(value) && "$in" in value) {
      const list = (value.$in || []).map((item) => (key === "id" ? String(item) : JSON.stringify(item)));
      if (!list.length) return { sql: "FALSE", params };
      params.push(list);
      parts.push(key === "id" ? `id = ANY($${params.length}::text[])` : `(data->'${safeKey(key)}')::text = ANY($${params.length}::text[])`);
    } else if (key === "id") {
      params.push(String(value));
      parts.push(`id = $${params.length}`);
    } else {
      equals[key] = value;
    }
  }
  if (Object.keys(equals).length) {
    params.push(JSON.stringify(equals));
    parts.push(`data @> $${params.length}::jsonb`);
  }
  return { sql: parts.join(" AND "), params };
}

function safeKey(key) {
  if (!/^[A-Za-z0-9_]+$/.test(key)) throw new Error(`Invalid field name: ${key}`);
  return key;
}

function orderBy(sort) {
  const raw = String(sort || "created_date");
  const desc = raw.startsWith("-");
  const key = safeKey(desc ? raw.slice(1) : raw);
  const dir = desc ? "DESC" : "ASC";
  if (SYSTEM_SORT.has(key)) return `${key} ${dir}, id ASC`;
  // Numbers sort numerically, everything else as text; missing values last.
  return `CASE WHEN jsonb_typeof(data->'${key}') = 'number' THEN (data->>'${key}')::double precision END ${dir} NULLS LAST, data->>'${key}' ${dir} NULLS LAST, created_date ASC`;
}

function limitOf(options) {
  const n = Number(options?.limit);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 5000) : 500;
}

function makeEntity(entity) {
  const api = {
    async filter(query = {}, options = {}) {
      const sql = await getSql();
      const w = where(entity, query, []);
      const params = [...w.params, limitOf(options)];
      const rows = await sql.query(
        `SELECT * FROM records WHERE ${w.sql} ORDER BY ${orderBy(options?.sort)} LIMIT $${params.length}`,
        params
      );
      return { items: rows.map(toRecord) };
    },
    list(options = {}) {
      return api.filter({}, options);
    },
    async get(id) {
      const sql = await getSql();
      const rows = await sql.query(`SELECT * FROM records WHERE entity = $1 AND id = $2`, [entity, String(id)]);
      if (!rows[0]) {
        const error = new Error(`${entity} ${id} not found`);
        error.status = 404;
        throw error;
      }
      return toRecord(rows[0]);
    },
    async create(values = {}) {
      const sql = await getSql();
      const rows = await sql.query(
        `INSERT INTO records (entity, id, data) VALUES ($1, $2, $3::jsonb) RETURNING *`,
        [entity, newId(), JSON.stringify(stripSystem(values))]
      );
      return toRecord(rows[0]);
    },
    async update(id, patch = {}) {
      const sql = await getSql();
      const rows = await sql.query(
        `UPDATE records SET data = data || $3::jsonb, updated_date = now() WHERE entity = $1 AND id = $2 RETURNING *`,
        [entity, String(id), JSON.stringify(stripSystem(patch))]
      );
      if (!rows[0]) {
        const error = new Error(`${entity} ${id} not found`);
        error.status = 404;
        throw error;
      }
      return toRecord(rows[0]);
    },
    async delete(id) {
      const sql = await getSql();
      await sql.query(`DELETE FROM records WHERE entity = $1 AND id = $2`, [entity, String(id)]);
      return { ok: true };
    },
    async deleteMany(query = {}) {
      const sql = await getSql();
      const w = where(entity, query, []);
      const rows = await sql.query(`DELETE FROM records WHERE ${w.sql} RETURNING id`, w.params);
      return { deleted: rows.length };
    },
    async updateMany(query = {}, update = {}) {
      const sql = await getSql();
      const patch = update?.$set ? update.$set : update;
      const w = where(entity, query, []);
      const params = [...w.params, JSON.stringify(stripSystem(patch))];
      const rows = await sql.query(
        `UPDATE records SET data = data || $${params.length}::jsonb, updated_date = now() WHERE ${w.sql} RETURNING id`,
        params
      );
      return { updated: rows.length };
    },
    async bulkUpdate(rows = []) {
      const out = [];
      for (const row of rows) {
        if (!row?.id) continue;
        const { id, ...patch } = row;
        out.push(await api.update(id, patch));
      }
      return out;
    },
    async count(query = {}) {
      const sql = await getSql();
      const w = where(entity, query, []);
      const rows = await sql.query(`SELECT count(*)::int AS n FROM records WHERE ${w.sql}`, w.params);
      return Number(rows[0]?.n || 0);
    },
  };
  return api;
}

const cache = new Map();
const entities = new Proxy(
  {},
  {
    get(_target, name) {
      if (typeof name !== "string") return undefined;
      if (!cache.has(name)) cache.set(name, makeEntity(name));
      return cache.get(name);
    },
  }
);

// Same shape the server code used from Base44: client.entities.X and
// client.asServiceRole.entities.X / .integrations.Core.SendEmail.
export const serviceClient = {
  entities,
  integrations: { Core: { SendEmail: sendEmail, UploadPublicFile: uploadPublicFile } },
};
serviceClient.asServiceRole = serviceClient;
