import { MongoClient } from "mongodb";
import dns from "node:dns";

// The machine's default resolvers refuse SRV-record queries (querySrv
// ECONNREFUSED), which breaks mongodb+srv:// seed discovery. Send our own
// DNS lookups to public resolvers that serve SRV records (same fix the
// Express backend uses).
const DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];
// Point MONGODB_URI at a local mongod or an Atlas cluster. Defaults to a
// local instance so the app still works out of the box.
const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/booknook";

type SrvRecord = { name: string; port?: number };

// Node's c-ares path for SRV/TXT lookups (works when the resolver override
// is honored).
async function resolveViaNodeDns(host: string) {
  dns.setServers(DNS_SERVERS);
  const [srvRecords, txtChunks] = await Promise.all([
    dns.promises.resolve(`_mongodb._tcp.${host}`, "SRV") as Promise<SrvRecord[]>,
    dns.promises.resolve(host, "TXT") as Promise<string[][]>,
  ]);
  return {
    srvRecords,
    txtRecords: txtChunks.map((chunks) => chunks.join("")),
  };
}

// DoH-over-HTTPS path: independent of node:dns entirely. Used when the
// c-ares path is refused/blocked (observed intermittently inside the Next
// dev server on this machine).
async function dohQuery(name: string, type: string) {
  const res = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`
  );
  if (!res.ok) throw new Error(`DoH query for ${type} failed (${res.status})`);
  const json = (await res.json()) as { Answer?: Array<{ data?: string }> };
  return (json.Answer ?? [])
    .map((a) => (typeof a.data === "string" ? a.data : ""))
    .filter(Boolean);
}

async function resolveViaDoH(host: string) {
  const [srvAnswers, txtAnswers] = await Promise.all([
    dohQuery(`_mongodb._tcp.${host}`, "SRV"),
    dohQuery(host, "TXT"),
  ]);
  const srvRecords = srvAnswers.map((data) => {
    const [, , port, target] = data.trim().split(/\s+/);
    return { name: target.replace(/\.$/, ""), port: Number(port) };
  });
  return {
    srvRecords,
    txtRecords: txtAnswers.map((t) => t.replace(/^"|"$/g, "")),
  };
}

// Expand "mongodb+srv://<creds>@<seedhost>/path?params" into a standard
// "mongodb://<creds><seedlist>/path?params" using the resolved SRV + TXT
// records, so the driver never has to run its own SRV lookup. Credentials
// are copied through and never logged.
function buildStandardUri(
  parts: { credentials?: string; path: string; params: string },
  host: string,
  srvRecords: SrvRecord[],
  txtRecords: string[]
) {
  if (srvRecords.length === 0) {
    throw new Error(`No SRV addresses found for ${host}`);
  }
  const seeds = srvRecords
    .map((r) => `${r.name}:${r.port || 27017}`)
    .join(",");
  const queryParams = new URLSearchParams(parts.params ?? "");
  for (const txt of txtRecords) {
    for (const [key, value] of new URLSearchParams(txt)) {
      // TXT values (authSource, replicaSet) are defaults only: explicit
      // URI params always win.
      if (!queryParams.has(key)) queryParams.set(key, value);
    }
  }
  queryParams.set("ssl", "true");
  const creds = parts.credentials ? `${parts.credentials}@` : "";
  return `mongodb://${creds}${seeds}${parts.path}?${queryParams}`;
}

async function resolveConnectionTarget() {
  if (!uri.startsWith("mongodb+srv://")) return uri;
  const match = /^mongodb\+srv:\/\/(?:([^@]*)@)?([^/?]+)([^?]*)(?:\?(.*))?$/.exec(
    uri
  );
  if (!match) throw new Error("Invalid mongodb+srv connection string");
  const [, credentials, seedHost, path, params] = match;
  const resolved = await resolveViaNodeDns(seedHost).catch(() =>
    resolveViaDoH(seedHost)
  );
  return buildStandardUri(
    { credentials, path, params },
    seedHost,
    resolved.srvRecords,
    resolved.txtRecords
  );
}

// One client per process, reused across requests: connecting on every
// request would exhaust the connection pool quickly.
let clientPromise: Promise<MongoClient> | null = null;

export function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = resolveConnectionTarget().then((target) =>
      new MongoClient(target, {
        // First connect includes TCP + TLS + replica-set discovery; a
        // distant Atlas cluster can exceed 2s.
        serverSelectionTimeoutMS: 10000,
      }).connect()
    );
  }

  return clientPromise;
}
