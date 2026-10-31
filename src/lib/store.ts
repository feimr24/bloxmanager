import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { createDemoUser } from "./demo-user";
import { createSeedDatabase } from "./seed";
import type {
  Account,
  AccountRow,
  AccountStatus,
  Database,
  Group,
  GroupRow,
  OverviewResponse,
  Session,
  SessionRow,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "blox.json");

const globalStore = globalThis as unknown as { __bloxDb?: Database };

function databaseUrl() {
  // BLOX_DATABASE_URL is our app-specific secret; DATABASE_URL may be owned
  // by the Neon Vercel integration and therefore not editable as a Secret.
  const url = (process.env.BLOX_DATABASE_URL ?? process.env.DATABASE_URL)?.trim();
  if (!url) return null;
  if (!/^postgres(?:ql)?:\/\//i.test(url)) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
  }
  return url;
}

/** Load durable Neon state. Legacy JSON remains the local development fallback. */
export async function loadPersistentDb(): Promise<Database> {
  const url = databaseUrl();
  if (!url) return loadDb();

  const sql = neon(url);
  await sql`CREATE TABLE IF NOT EXISTS blox_state (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  const rows = await sql`SELECT data FROM blox_state WHERE id = 'primary'`;
  if (rows.length) {
    const db = rows[0].data as Database;
    if (ensureAuthCollections(db)) {
      await sql`UPDATE blox_state SET data = ${JSON.stringify(db)}::jsonb, updated_at = NOW()
        WHERE id = 'primary'`;
    }
    globalStore.__bloxDb = db;
    return db;
  }

  const initial = loadDb();
  await sql`INSERT INTO blox_state (id, data) VALUES ('primary', ${JSON.stringify(initial)}::jsonb)
    ON CONFLICT (id) DO NOTHING`;
  const inserted = await sql`SELECT data FROM blox_state WHERE id = 'primary'`;
  const db = inserted[0].data as Database;
  ensureAuthCollections(db);
  globalStore.__bloxDb = db;
  return db;
}

/** Persist the complete state as one atomic JSONB row in Neon. */
export async function savePersistentDb(db: Database): Promise<void> {
  const url = databaseUrl();
  if (!url) {
    saveDb(db);
    return;
  }

  const sql = neon(url);
  await sql`CREATE TABLE IF NOT EXISTS blox_state (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`INSERT INTO blox_state (id, data, updated_at)
    VALUES ('primary', ${JSON.stringify(db)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`;
  globalStore.__bloxDb = db;
}

/**
 * Database lama (sebelum fitur autentikasi) belum punya koleksi user/token.
 * Tambahkan tanpa menghapus data akun yang sudah ada.
 */
function ensureAuthCollections(db: Database) {
  let changed = false;
  if (!Array.isArray(db.users)) {
    db.users = [createDemoUser()];
    changed = true;
  }
  if (!Array.isArray(db.authSessions)) {
    db.authSessions = [];
    changed = true;
  }
  if (db.version < 2) {
    db.version = 2;
    changed = true;
  }
  return changed;
}

export function loadDb(): Database {
  if (globalStore.__bloxDb) return globalStore.__bloxDb;

  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const seeded = createSeedDatabase();
    ensureAuthCollections(seeded);
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeded));
    globalStore.__bloxDb = seeded;
    return seeded;
  }

  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as Database;
  if (ensureAuthCollections(parsed)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(parsed));
  }
  globalStore.__bloxDb = parsed;
  return parsed;
}

export function saveDb(db: Database) {
  globalStore.__bloxDb = db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DATA_FILE);
}

export function groupLookup(db: Database) {
  const map = new Map<string, Group[]>();
  for (const group of db.groups) {
    for (const accountId of group.memberIds) {
      const list = map.get(accountId) ?? [];
      list.push(group);
      map.set(accountId, list);
    }
  }
  return map;
}

export function toAccountRow(
  account: Account,
  db: Database,
  groups?: Group[],
): AccountRow {
  const memberships = groups ?? groupLookup(db).get(account.id) ?? [];
  const running = db.sessions.find(
    (session) => session.accountId === account.id && session.status === "running",
  );
  return {
    id: account.id,
    username: account.username,
    status: account.status,
    createdAt: account.createdAt,
    suspendedAt: account.suspendedAt,
    suspendedUntil: account.suspendedUntil,
    lastActiveAt: account.lastActiveAt,
    groupIds: memberships.map((group) => group.id),
    groupNames: memberships.map((group) => group.name),
    runningSession: running
      ? {
          id: running.id,
          deviceType: running.deviceType,
          deviceName: running.deviceName,
          startedAt: running.startedAt,
        }
      : undefined,
  };
}

export function accountCounts(db: Database): Record<AccountStatus, number> {
  const counts: Record<AccountStatus, number> = { active: 0, available: 0, suspended: 0 };
  for (const account of db.accounts) counts[account.status] += 1;
  return counts;
}

export function listAccounts(
  db: Database,
  options: {
    query?: string;
    status?: string;
    groupId?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
  },
) {
  const lookup = groupLookup(db);
  const query = (options.query ?? "").trim().toLowerCase();
  const status = options.status && options.status !== "all" ? options.status : null;
  const group = options.groupId
    ? db.groups.find((item) => item.id === options.groupId)
    : undefined;
  const memberSet = group ? new Set(group.memberIds) : null;

  let rows = db.accounts
    .filter((account) => (status ? account.status === status : true))
    .filter((account) => (memberSet ? memberSet.has(account.id) : true))
    .filter((account) => (query ? account.username.toLowerCase().includes(query) : true))
    .sort((a, b) => {
      if (options.sort === "username") return a.username.localeCompare(b.username);
      if (options.sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .map((account) => toAccountRow(account, db, lookup.get(account.id) ?? []));

  const reopened = rows
    .filter(
      (row) =>
        row.status === "suspended" &&
        row.suspendedUntil &&
        new Date(row.suspendedUntil).getTime() <= Date.now(),
    )
    .map((row) => ({
      id: row.id,
      username: row.username,
      suspendedUntil: row.suspendedUntil as string,
    }));

  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 5), 100);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(options.page ?? 1, 1), totalPages);
  rows = rows.slice((page - 1) * pageSize, page * pageSize);

  return {
    items: rows,
    total,
    page,
    pageSize,
    totalPages,
    counts: accountCounts(db),
    reopened,
  };
}

export function sessionRow(session: Session, db: Database): SessionRow {
  const account = db.accounts.find((item) => item.id === session.accountId);
  return {
    ...session,
    username: account?.username ?? "akun-dihapus",
    accountStatus: account?.status ?? "suspended",
  };
}

export function listSessions(
  db: Database,
  options: { status?: string; device?: string; query?: string; limit?: number },
) {
  const query = (options.query ?? "").trim().toLowerCase();
  const rows = db.sessions
    .map((session) => sessionRow(session, db))
    .filter((session) => (options.status && options.status !== "all" ? session.status === options.status : true))
    .filter((session) => (options.device && options.device !== "all" ? session.deviceType === options.device : true))
    .filter((session) => (query ? session.username.toLowerCase().includes(query) : true))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return {
    items: rows.slice(0, options.limit ?? 200),
    total: rows.length,
    counts: {
      running: rows.filter((session) => session.status === "running").length,
      completed: rows.filter((session) => session.status === "completed").length,
      failed: rows.filter((session) => session.status === "failed").length,
    },
  };
}

export function groupRows(db: Database): GroupRow[] {
  const lookup = groupLookup(db);
  return db.groups.map((group) => ({
    ...group,
    members: group.memberIds
      .map((id) => db.accounts.find((account) => account.id === id))
      .filter((account): account is Account => Boolean(account))
      .map((account) => toAccountRow(account, db, lookup.get(account.id) ?? [])),
  }));
}

export function buildOverview(db: Database): OverviewResponse {
  const counts = accountCounts(db);
  const trend = db.trend;
  const last = trend[trend.length - 1];
  const prevWeek = trend[Math.max(0, trend.length - 8)];
  const today = new Date().toISOString().slice(0, 10);
  const running = db.sessions.filter((session) => session.status === "running");
  const suspendedToday = db.audit.filter(
    (entry) => entry.type === "suspend" && entry.at.slice(0, 10) === today,
  ).length;

  const devices = (["pc", "handphone", "redfingers"] as const).map((deviceType) => ({
    deviceType,
    sessions: db.sessions.filter((session) => session.deviceType === deviceType).length,
    running: running.filter((session) => session.deviceType === deviceType).length,
    accounts: db.groups
      .filter((group) => group.deviceType === deviceType)
      .reduce((total, group) => total + group.memberIds.length, 0),
  }));

  const recentSessions = db.sessions
    .map((session) => sessionRow(session, db))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 6);

  const alerts = db.audit
    .filter((entry) => entry.type === "suspend")
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 4)
    .map((entry) => {
      const account = db.accounts.find((item) => item.id === entry.accountId);
      const group = db.groups.find((item) => item.memberIds.includes(entry.accountId));
      return {
        id: entry.id,
        accountId: entry.accountId,
        username: account?.username ?? "akun-dihapus",
        deviceName: group?.name ?? "Redfingers Server 1",
        groupName: group?.name ?? "Tanpa grup",
        at: entry.at,
        message: entry.message,
      };
    });

  const topGroups = db.groups
    .map((group) => ({
      id: group.id,
      name: group.name,
      deviceType: group.deviceType,
      members: group.memberIds.length,
    }))
    .sort((a, b) => b.members - a.members);

  const reopened = db.accounts
    .filter(
      (account) =>
        account.status === "suspended" &&
        account.suspendedUntil &&
        new Date(account.suspendedUntil).getTime() <= Date.now(),
    )
    .map((account) => ({
      id: account.id,
      username: account.username,
      suspendedUntil: account.suspendedUntil as string,
      overdueDays: Math.max(
        0,
        Math.floor((Date.now() - new Date(account.suspendedUntil as string).getTime()) / 86400000),
      ),
    }))
    .sort((a, b) => new Date(a.suspendedUntil).getTime() - new Date(b.suspendedUntil).getTime());

  return {
    stats: {
      total: counts.active + counts.available + counts.suspended,
      active: counts.active,
      available: counts.available,
      suspended: counts.suspended,
      activeDelta: last.active - prevWeek.active,
      suspendedDelta: last.suspended - prevWeek.suspended,
      runningSessions: running.length,
      suspendedToday,
    },
    trend,
    deviceBreakdown: devices,
    recentSessions,
    alerts,
    topGroups,
    reopened,
  };
}
