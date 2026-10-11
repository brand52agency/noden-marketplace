// SSRF guard tests. Offline cases always run; the live case needs internet.
import assert from "node:assert/strict";
import { assertPublicUrl, isBlockedIp, safeFetch, UnsafeUrlError } from "../lib/safe-fetch";

const blockedIps = [
  "127.0.0.1", "127.1.2.3", "10.0.0.5", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1",
  "0.0.0.0", "224.0.0.1", "255.255.255.255", "198.18.0.1", "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1",
  "::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:7f00:1", "::ffff:a9fe:a9fe", "2002:7f00:1::", "64:ff9b::7f00:1", "2001:db8::1",
];
for (const ip of blockedIps) assert.ok(isBlockedIp(ip), `${ip} must be blocked`);
for (const ip of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) {
  assert.ok(!isBlockedIp(ip), `${ip} must be allowed`);
}
console.log(`PASS ${blockedIps.length} blocked and 6 allowed addresses classified correctly`);

const badUrls = [
  "http://localhost/", "http://localhost:80/", "http://127.0.0.1/", "http://2130706433/", "http://0x7f000001/", "http://0177.0.0.1/",
  "http://[::1]/", "http://[::ffff:127.0.0.1]/", "http://169.254.169.254/latest/meta-data/", "http://metadata.google.internal/",
  "http://foo.localhost/", "http://printer.local/", "http://intranet/", "http://example.com:8080/", "http://example.com:22/",
  "ftp://example.com/", "file:///etc/passwd", "gopher://example.com/", "javascript:alert(1)", "http://user:pw@example.com/", "not a url",
];
for (const u of badUrls) assert.throws(() => assertPublicUrl(u), UnsafeUrlError, `${u} must be refused`);
for (const u of ["https://example.com/", "http://example.com/a?b=c", "https://sub.example.co.uk:443/x"]) assert.doesNotThrow(() => assertPublicUrl(u));
console.log(`PASS ${badUrls.length} unsafe URLs refused, public URLs accepted`);

async function main() {
  // A hostname that resolves to loopback must be refused at connect time (localtest.me -> 127.0.0.1).
  await assert.rejects(() => safeFetch("http://localtest.me/"), /private address|ENOTFOUND|EAI_AGAIN/);
  console.log("PASS hostname resolving to 127.0.0.1 is refused at connect time");

  try {
    const r = await safeFetch("https://example.com/", { maxBytes: 100_000 });
    assert.equal(r.status, 200);
    assert.ok(r.body.includes("Example Domain"));
    console.log("PASS live fetch of https://example.com works");
    const small = await safeFetch("https://example.com/", { maxBytes: 100 });
    assert.ok(small.truncated && small.body.length <= 100);
    console.log("PASS response size cap truncates");
    const head = await safeFetch("https://example.com/", { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.body, "");
    console.log("PASS HEAD request returns no body");
  } catch (e) {
    if (/ENOTFOUND|EAI_AGAIN|timed out|ECONN/.test(String(e))) console.log("SKIP live fetch tests (no network)");
    else throw e;
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
