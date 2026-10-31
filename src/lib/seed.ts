import type { Database } from "./types";

/** Fresh installation: keep the schema and begin with no sample data. */
export function createSeedDatabase(): Database {
  return {
    version: 2,
    accounts: [],
    groups: [],
    sessions: [],
    audit: [],
    trend: [],
    users: [],
    authSessions: [],
  };
}
