import { encryptPassword } from "./crypto";
import type {
  Account,
  AccountStatus,
  AuditEntry,
  Database,
  DeviceType,
  Group,
  Session,
  TrendPoint,
} from "./types";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261030);
const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];

const THEMES = [
  "blox", "farm", "harvest", "miner", "neon", "pixel", "void", "ember",
  "frost", "turbo", "robux", "crate", "ghost", "nitro", "aqua", "blaze",
  "shadow", "lucky", "storm", "titan", "cobalt", "raven", "onyx", "viper",
  "zenith", "orbit", "lunar", "echo", "delta", "flux",
];

const DEVICES: Record<DeviceType, string[]> = {
  pc: ["PC Rig-01", "PC Rig-02", "PC Rig-03", "PC Rig-04", "PC Rig-05", "PC Rig-06"],
  handphone: ["Poco X3", "Redmi Note 12", "iPhone 11", "Samsung A54", "Infinix Hot 12"],
  redfingers: ["Redfingers Server 1", "Redfingers Server 2", "Redfingers Server 3"],
};

const TOTAL = 1204;
// Empat akun contoh sudah punya status tetap di bawah, jadi sisa 1.200 akun
// didistribusikan agar total akhir tepat 840 aktif / 312 tersedia / 52 suspend.
const COUNTS: Record<AccountStatus, number> = {
  active: 839,
  available: 311,
  suspended: 50,
};

export function createSeedDatabase(): Database {
  const now = Date.now();

  const statuses: AccountStatus[] = [];
  (Object.keys(COUNTS) as AccountStatus[]).forEach((status) => {
    for (let i = 0; i < COUNTS[status]; i += 1) statuses.push(status);
  });
  // Fisher-Yates deterministik supaya urutan status terasa acak.
  for (let i = statuses.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }

  const fixed: { username: string; status: AccountStatus }[] = [
    { username: "blox_master99", status: "active" },
    { username: "farm_bot_01", status: "suspended" },
    { username: "harvest_king", status: "available" },
    { username: "miner_dude", status: "suspended" },
  ];

  const accounts: Account[] = fixed.map((item, index) => {
    const createdAt = new Date(now - (640 - index * 37) * 86400000).toISOString();
    return {
      id: `acc_${String(index + 1).padStart(4, "0")}`,
      username: item.username,
      passwordEnc: encryptPassword(`Blx!${item.username.slice(0, 3)}${1000 + index}`),
      status: item.status,
      createdAt,
      updatedAt: createdAt,
      lastActiveAt:
        item.status === "active" ? new Date(now - (index + 2) * 60000).toISOString() : undefined,
      suspendedAt:
        item.status === "suspended" ? new Date(now - (index + 1) * 7200000).toISOString() : undefined,
    };
  });

  let themeIndex = 0;
  for (let i = 0; i < TOTAL - fixed.length; i += 1) {
    const theme = THEMES[themeIndex % THEMES.length];
    themeIndex += 1;
    const username = `${theme}_${String(i + 1).padStart(4, "0")}`;
    const status = statuses[i];
    const createdAt = new Date(now - Math.floor(rand() * 700 + 5) * 86400000);
    accounts.push({
      id: `acc_${String(accounts.length + 1).padStart(4, "0")}`,
      username,
      passwordEnc: encryptPassword(`${pick(["Roblox", "Blox", "Farm"])}@${100 + Math.floor(rand() * 8999)}`),
      status,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      lastActiveAt:
        status === "active"
          ? new Date(now - Math.floor(rand() * 2880 + 5) * 60000).toISOString()
          : undefined,
      suspendedAt:
        status === "suspended"
          ? new Date(now - Math.floor(rand() * 26 + 1) * 86400000).toISOString()
          : undefined,
    });
  }

  const activeAccounts = accounts.filter((account) => account.status === "active");
  const suspendedAccounts = accounts.filter((account) => account.status === "suspended");

  // Enam suspend terbaru di Redfingers Server 1 untuk audit trail dashboard.
  const redfingersSuspended = suspendedAccounts.slice(-6);
  redfingersSuspended.forEach((account, index) => {
    account.suspendedAt = new Date(now - (index * 3 + 2) * 60000).toISOString();
  });

  const groups: Group[] = [
    {
      id: "grp_pc_alpha",
      name: "PC Rig Alpha",
      description: "Kluster farming utama untuk rig lokal kantor.",
      deviceType: "pc",
      memberIds: activeAccounts.slice(0, 120).map((account) => account.id),
      createdAt: new Date(now - 190 * 86400000).toISOString(),
    },
    {
      id: "grp_handphone_farm",
      name: "Handphone Farm",
      description: "Akun untuk perangkat seluler fisik di meja operasional.",
      deviceType: "handphone",
      memberIds: activeAccounts.slice(120, 168).map((account) => account.id),
      createdAt: new Date(now - 140 * 86400000).toISOString(),
    },
    {
      id: "grp_redfingers_s1",
      name: "Redfingers Server 1",
      description: "Cloud phone utama. Pantau risiko suspend berjamaah.",
      deviceType: "redfingers",
      memberIds: [
        ...activeAccounts.slice(168, 342).map((account) => account.id),
        ...redfingersSuspended.map((account) => account.id),
      ],
      createdAt: new Date(now - 96 * 86400000).toISOString(),
    },
  ];

  const sessions: Session[] = [];
  let sessionCounter = 1;
  const addSession = (session: Omit<Session, "id">) => {
    sessions.push({ ...session, id: `ses_${String(sessionCounter).padStart(4, "0")}` });
    sessionCounter += 1;
  };

  const runningDevices: DeviceType[] = ["pc", "handphone", "redfingers"];
  for (let i = 0; i < 42; i += 1) {
    const account = activeAccounts[i * 3 + 1];
    const deviceType = runningDevices[i % 3];
    const startedAt = new Date(now - Math.floor(rand() * 210 + 8) * 60000).toISOString();
    addSession({
      accountId: account.id,
      deviceType,
      deviceName: pick(DEVICES[deviceType]),
      startedAt,
      endedAt: null,
      status: "running",
    });
    account.status = "active";
    account.lastActiveAt = startedAt;
  }

  for (let i = 0; i < 96; i += 1) {
    const account = activeAccounts[(i * 7 + 20) % activeAccounts.length];
    const deviceType = runningDevices[i % 3];
    const endedAt = now - Math.floor(rand() * 5 * 86400000 + 3600000);
    const duration = Math.floor(rand() * 260 + 20) * 60000;
    addSession({
      accountId: account.id,
      deviceType,
      deviceName: pick(DEVICES[deviceType]),
      startedAt: new Date(endedAt - duration).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      status: "completed",
    });
  }

  for (let i = 0; i < 6; i += 1) {
    const account = redfingersSuspended[i] ?? suspendedAccounts[i];
    addSession({
      accountId: account.id,
      deviceType: "redfingers",
      deviceName: "Redfingers Server 1",
      startedAt: new Date(now - (40 + i * 14) * 60000).toISOString(),
      endedAt: new Date(now - (34 + i * 14) * 60000).toISOString(),
      status: "failed",
      note: "Login clash terdeteksi — sesi dihentikan sistem",
    });
  }

  const trend: TrendPoint[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(now - i * 86400000);
    const progress = (29 - i) / 29;
    const active = Math.round(782 + progress * 58 + Math.sin(i * 0.7) * 9 + rand() * 8);
    const suspended = Math.round(28 + progress * 24 + rand() * 5);
    trend.push({
      date: day.toISOString().slice(0, 10),
      active,
      suspended,
    });
  }
  trend[trend.length - 1].active = 840;
  trend[trend.length - 1].suspended = 52;

  const audit: AuditEntry[] = redfingersSuspended.map((account, index) => ({
    id: `aud_${String(index + 1).padStart(4, "0")}`,
    accountId: account.id,
    type: "suspend",
    message: `Tersuspend saat sesi aktif di Redfingers Server 1`,
    at: account.suspendedAt ?? new Date(now).toISOString(),
  }));

  return {
    version: 1,
    accounts,
    groups,
    sessions,
    audit,
    trend,
  };
}
