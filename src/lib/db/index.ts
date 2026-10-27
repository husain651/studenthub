import fs from "fs";
import path from "path";

// Unified Database interface supporting both external PostgreSQL (via pg) and embedded PostgreSQL (via @electric-sql/pglite)
let pgliteInstance: any = null;
let pgPoolInstance: any = null;

export async function getDbClient() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    if (!pgPoolInstance) {
      const { Pool } = await import("pg");
      pgPoolInstance = new Pool({
        connectionString: databaseUrl,
      });
    }
    return {
      type: "pg" as const,
      async query(sqlText: string, params: any[] = []) {
        // Convert ? placeholders to $1, $2 if any
        let paramIndex = 1;
        const pgSql = sqlText.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await pgPoolInstance.query(pgSql, params);
        return { rows: res.rows };
      },
    };
  }

  // Fallback to embedded real PostgreSQL engine (PGlite)
  if (!pgliteInstance) {
    const { PGlite } = await import("@electric-sql/pglite");
    const dataDir = path.resolve(process.cwd(), process.env.PGLITE_DATA_DIR || "./data/pgdata");

    // Ensure parent dir exists
    if (!fs.existsSync(path.dirname(dataDir))) {
      fs.mkdirSync(path.dirname(dataDir), { recursive: true });
    }

    // Use a string path for PGlite
    pgliteInstance = new PGlite(dataDir.toString());
    await pgliteInstance.waitReady;
  }

  return {
    type: "pglite" as const,
    async query(sqlText: string, params: any[] = []) {
      // PGlite natively supports standard PostgreSQL syntax and $1, $2, ... parameters
      let paramIndex = 1;
      const pgSql = sqlText.replace(/\?/g, () => `$${paramIndex++}`);
      const res = await pgliteInstance.query(pgSql, params);
      return { rows: res.rows };
    },
  };
}

let isDbInitialized = false;
let initPromise: Promise<void> | null = null;

export async function rawQuery<T = any>(sqlText: string, params: any[] = []): Promise<T[]> {
  const db = await getDbClient();
  const res = await db.query(sqlText, params);
  return res.rows as T[];
}

export async function ensureDbReady(): Promise<void> {
  if (isDbInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await initDatabase();
      // Check if tables are populated using rawQuery directly to prevent re-entrancy
      const users = await rawQuery<{ count: string | number }>(
        `SELECT count(*) as count FROM users`
      );
      if (!users || users.length === 0 || Number(users[0].count) === 0) {
        const { seedDatabase } = await import("./seed-data");
        await seedDatabase();
      }
      isDbInitialized = true;
    } catch (err: any) {
      console.error("Database initialization error:", err);
      // Reset promise to allow retry on next request
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export async function query<T = any>(sqlText: string, params: any[] = []): Promise<T[]> {
  if (!isDbInitialized && !initPromise) {
    await ensureDbReady();
  }
  return rawQuery<T>(sqlText, params);
}

export async function queryOne<T = any>(sqlText: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sqlText, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function initDatabase(): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), "src/lib/db/schema.sql");
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  
  // Execute schema creation
  const db = await getDbClient();
  if (db.type === "pglite") {
    await pgliteInstance.exec(schemaSql);
  } else {
    await pgPoolInstance.query(schemaSql);
  }
}
