// Fetching URLs on a caller's behalf (NODEN_PRICING_TASKS.md D3). Callers control the URL, so this
// must never reach Noden's own network or a cloud metadata service:
//   - only http/https on ports 80/443, no credentials in the URL
//   - every address a hostname resolves to is checked, at connect time (so a DNS answer that
//     changes between "check" and "connect" can't slip through), and private, loopback,
//     link-local, CGNAT, multicast, reserved and metadata ranges are refused
//   - at most 3 redirects, each hop re-checked
//   - response size and total time are capped; responses are never decompressed (identity only)
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

export class UnsafeUrlError extends Error {}
export class FetchLimitError extends Error {}

const MAX_REDIRECTS = 3;
const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_TIMEOUT_MS = 8_000;
const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal", "metadata", "instance-data"]);

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((n, p) => n * 256 + Number(p), 0);
}
const inRange4 = (ip: string, base: string, bits: number) => {
  const size = 2 ** (32 - bits);
  const start = ipv4ToInt(base);
  const v = ipv4ToInt(ip);
  return v >= start && v < start + size;
};
const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

// True when the address is anywhere an outside caller must not be able to make us connect to.
export function isBlockedIp(raw: string): boolean {
  let ip = raw.trim().toLowerCase();
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  ip = ip.split("%")[0]; // zone id
  if (net.isIPv4(ip)) return BLOCKED_V4.some(([base, bits]) => inRange4(ip, base, bits));
  if (!net.isIPv6(ip)) return true; // not an address we understand: refuse
  // IPv4-mapped / compatible (::ffff:a.b.c.d, ::a.b.c.d) -> judge by the embedded IPv4
  const mapped = ip.match(/^(?:0{0,4}:){2,5}(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIp(mapped[1]);
  const hex = ip.match(/^(?:0{0,4}:){2,5}(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const a = parseInt(hex[1], 16), b = parseInt(hex[2], 16);
    return isBlockedIp(`${a >> 8}.${a & 255}.${b >> 8}.${b & 255}`);
  }
  const groups = expandV6(ip);
  if (!groups) return true;
  const first = groups[0];
  if (groups.every((g) => g === 0)) return true; // ::
  if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) return true; // ::1
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((first & 0xff00) === 0xff00) return true; // multicast
  if (first === 0x2001 && groups[1] === 0x0db8) return true; // documentation
  if (first === 0x0064 && groups[1] === 0xff9b) return true; // NAT64: embeds an IPv4 we haven't judged
  if (first === 0x2002) return true; // 6to4: embeds an IPv4 we haven't judged
  return false;
}

function expandV6(ip: string): number[] | null {
  const [head, tail] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail !== undefined && tail ? tail.split(":") : [];
  const fill = ip.includes("::") ? 8 - h.length - t.length : 0;
  if (fill < 0) return null;
  const all = [...h, ...Array(fill).fill("0"), ...t];
  if (all.length !== 8) return null;
  const nums = all.map((g) => parseInt(g || "0", 16));
  return nums.some((n) => Number.isNaN(n)) ? null : nums;
}

// Checks a URL before any request. Returns the parsed URL.
export function assertPublicUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UnsafeUrlError("not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new UnsafeUrlError("only http and https URLs are allowed");
  if (url.username || url.password) throw new UnsafeUrlError("URLs with credentials are not allowed");
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
  if (port !== 80 && port !== 443) throw new UnsafeUrlError("only ports 80 and 443 are allowed");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) throw new UnsafeUrlError("missing host");
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new UnsafeUrlError("that host is not allowed");
  }
  const literal = host.startsWith("[") ? host.slice(1, -1) : host;
  if (net.isIP(literal)) {
    if (isBlockedIp(literal)) throw new UnsafeUrlError("that address is not allowed");
  } else if (!host.includes(".")) {
    throw new UnsafeUrlError("that host is not allowed");
  }
  return url;
}

// A DNS lookup used for the actual connection: it refuses to hand back any blocked address.
const safeLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 4);
    const list = (addresses as dns.LookupAddress[]).filter((a) => !isBlockedIp(a.address));
    if (list.length === 0) return callback(new UnsafeUrlError("that host resolves to a private address") as NodeJS.ErrnoException, "", 4);
    if ((options as { all?: boolean }).all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

export type SafeResponse = {
  url: string; // final URL after redirects
  status: number;
  headers: Record<string, string>;
  body: string;
  redirects: string[];
  truncated: boolean;
};

type Options = { maxBytes?: number; timeoutMs?: number; method?: "GET" | "HEAD"; accept?: string; userAgent?: string };

function once(url: URL, opts: Required<Pick<Options, "maxBytes" | "method">> & Options, deadline: number): Promise<SafeResponse> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return reject(new FetchLimitError("timed out"));
    const req = mod.request(
      url,
      {
        method: opts.method,
        lookup: safeLookup,
        timeout: remaining,
        headers: {
          "user-agent": opts.userAgent ?? "NodenBot/1.0 (+https://getnoden.com)",
          accept: opts.accept ?? "*/*",
          "accept-encoding": "identity",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        let truncated = false;
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) headers[k] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
        const finish = () =>
          resolve({ url: url.toString(), status: res.statusCode ?? 0, headers, body: Buffer.concat(chunks).toString("utf8"), redirects: [], truncated });
        if (opts.method === "HEAD") { res.resume(); return finish(); }
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > opts.maxBytes) {
            truncated = true;
            chunks.push(c.subarray(0, c.length - (size - opts.maxBytes)));
            res.destroy();
            return finish();
          }
          chunks.push(c);
        });
        res.on("end", finish);
        res.on("error", (e) => (truncated ? undefined : reject(e)));
      },
    );
    req.on("timeout", () => req.destroy(new FetchLimitError("timed out")));
    req.on("error", reject);
    req.setTimeout(remaining);
    req.end();
  });
}

export async function safeFetch(input: string, options: Options = {}): Promise<SafeResponse> {
  const opts = { maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES, method: options.method ?? "GET", ...options } as Required<Pick<Options, "maxBytes" | "method">> & Options;
  const deadline = Date.now() + (options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const redirects: string[] = [];
  let url = assertPublicUrl(input);
  for (let hop = 0; ; hop++) {
    const res = await once(url, opts, deadline);
    const loc = res.headers.location;
    if (res.status >= 300 && res.status < 400 && loc) {
      if (hop >= MAX_REDIRECTS) throw new FetchLimitError("too many redirects");
      url = assertPublicUrl(new URL(loc, url).toString()); // every hop is re-checked
      redirects.push(url.toString());
      continue;
    }
    return { ...res, redirects };
  }
}
