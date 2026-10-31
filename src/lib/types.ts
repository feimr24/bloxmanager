export type AccountStatus = "active" | "available" | "suspended";
export type DeviceType = "pc" | "handphone" | "redfingers";
export type SessionStatus = "running" | "completed" | "failed";
export type AuditType = "suspend" | "reveal" | "create" | "update" | "session";

export interface Account {
  id: string;
  username: string;
  passwordEnc: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  suspendedAt?: string;
  suspendedUntil?: string;
  lastActiveAt?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  deviceType: DeviceType;
  memberIds: string[];
  createdAt: string;
}

export interface Session {
  id: string;
  accountId: string;
  deviceType: DeviceType;
  deviceName: string;
  startedAt: string;
  endedAt: string | null;
  status: SessionStatus;
  note?: string;
}

export interface AuditEntry {
  id: string;
  accountId: string;
  type: AuditType;
  message: string;
  at: string;
}

export interface TrendPoint {
  date: string;
  active: number;
  suspended: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type AuthTokenType = "verify" | "reset";

export interface AuthUserSummary {
  username: string;
  email: string;
}

export interface AuthToken {
  id: string;
  userId: string;
  type: AuthTokenType;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ip?: string;
}

export interface Database {
  version: number;
  accounts: Account[];
  groups: Group[];
  sessions: Session[];
  audit: AuditEntry[];
  trend: TrendPoint[];
  users: User[];
  authTokens: AuthToken[];
  authSessions: AuthSession[];
}

export interface AccountRow {
  id: string;
  username: string;
  status: AccountStatus;
  createdAt: string;
  suspendedAt?: string;
  suspendedUntil?: string;
  lastActiveAt?: string;
  groupIds: string[];
  groupNames: string[];
  runningSession?: {
    id: string;
    deviceType: DeviceType;
    deviceName: string;
    startedAt: string;
  };
}

export interface SessionRow extends Session {
  username: string;
  accountStatus: AccountStatus;
}

export interface GroupRow extends Group {
  members: AccountRow[];
}

export interface OverviewResponse {
  stats: {
    total: number;
    active: number;
    available: number;
    suspended: number;
    activeDelta: number;
    suspendedDelta: number;
    runningSessions: number;
    suspendedToday: number;
  };
  trend: TrendPoint[];
  deviceBreakdown: { deviceType: DeviceType; sessions: number; running: number; accounts: number }[];
  recentSessions: SessionRow[];
  alerts: {
    id: string;
    accountId: string;
    username: string;
    deviceName: string;
    groupName: string;
    at: string;
    message: string;
  }[];
  topGroups: { id: string; name: string; deviceType: DeviceType; members: number }[];
  reopened: { id: string; username: string; suspendedUntil: string; overdueDays: number }[];
}
